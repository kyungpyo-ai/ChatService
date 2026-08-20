import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUserClaims } from "@/lib/supabase/auth";
import { getPostDetail } from "@/lib/queries/board";
import { PostDetailView } from "@/components/board/post-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPostDetail(postId);

  if (!post) {
    return { title: "게시글을 찾을 수 없어요 | 달나루" };
  }

  const description = post.content.length > 100 ? `${post.content.slice(0, 100)}…` : post.content;

  return {
    title: `${post.title} | 달나루 게시판`,
    description,
    alternates: { canonical: `/board/${postId}` },
  };
}

export default async function BoardPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  const [post, claims] = await Promise.all([getPostDetail(postId), getCurrentUserClaims()]);

  if (!post) {
    notFound();
  }

  return <PostDetailView post={post} currentUserId={claims?.sub ?? null} />;
}
