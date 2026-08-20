import { notFound } from "next/navigation";
import { getCurrentUserClaims } from "@/lib/supabase/auth";
import { getPostDetail } from "@/lib/queries/board";
import { PostDetailView } from "@/components/board/post-detail-view";

export default async function BoardPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;

  const [post, claims] = await Promise.all([getPostDetail(postId), getCurrentUserClaims()]);

  if (!post) {
    notFound();
  }

  return <PostDetailView post={post} currentUserId={claims?.sub ?? null} />;
}
