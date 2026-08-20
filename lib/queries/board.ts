/**
 * 게시판(사용자 커뮤니티 보드) 관련 데이터베이스 쿼리 함수 (§ROADMAP Phase 12)
 *
 * 목록/상세는 게스트를 포함해 누구나 조회할 수 있다 — rooms 목록과 동일한 공개 열람 모델.
 */

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type PostTag = "find_user" | "suggestion" | "etc";

export interface PostListItem {
  id: string;
  tag: PostTag;
  title: string;
  authorId: string;
  authorNickname: string;
  authorAvatarUrl: string | null;
  viewCount: number;
  commentCount: number;
  createdAt: string;
}

export interface PostListPage {
  posts: PostListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export const POSTS_PAGE_SIZE = 20;

interface PostListRow {
  id: string;
  tag: string;
  title: string;
  view_count: number;
  created_at: string;
  author: { id: string; username: string | null; avatar_url: string | null } | null;
  post_comment_count: number;
}

/**
 * 게시글 목록 조회 — 태그 필터(선택) + 페이지 단위(POSTS_PAGE_SIZE)로 최신순 조회.
 */
export async function getPostList(page: number = 1, tag?: PostTag): Promise<PostListPage> {
  const supabase = await createClient();

  const from = (page - 1) * POSTS_PAGE_SIZE;
  const to = from + POSTS_PAGE_SIZE - 1;

  let query = supabase
    .from("posts")
    .select(
      "id, tag, title, view_count, created_at, author:profiles!posts_author_id_fkey(id, username, avatar_url), post_comment_count",
      { count: "exact" }
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (tag) {
    query = query.eq("tag", tag);
  }

  const { data, count, error } = await query;

  if (error || !data) {
    return { posts: [], page, pageSize: POSTS_PAGE_SIZE, totalCount: 0 };
  }

  const rows = data as unknown as PostListRow[];
  const posts = rows
    .filter((row) => row.author !== null)
    .map((row) => ({
      id: row.id,
      tag: row.tag as PostTag,
      title: row.title,
      authorId: row.author!.id,
      authorNickname: row.author!.username ?? "알 수 없음",
      authorAvatarUrl: row.author!.avatar_url,
      viewCount: row.view_count,
      commentCount: row.post_comment_count,
      createdAt: row.created_at,
    }));

  return { posts, page, pageSize: POSTS_PAGE_SIZE, totalCount: count ?? 0 };
}

export interface PostComment {
  id: string;
  authorId: string;
  authorNickname: string;
  authorAvatarUrl: string | null;
  content: string;
  createdAt: string;
}

export interface PostDetail {
  id: string;
  tag: PostTag;
  title: string;
  content: string;
  authorId: string;
  authorNickname: string;
  authorAvatarUrl: string | null;
  viewCount: number;
  createdAt: string;
  comments: PostComment[];
}

interface PostCommentRow {
  id: string;
  content: string;
  created_at: string;
  author: { id: string; username: string | null; avatar_url: string | null } | null;
}

/**
 * 게시글 상세 + 댓글 목록을 함께 조회한다. 조회수 증가(increment_post_view_count)는
 * 페이지 렌더와 무관한 부수효과라 별도로 fire-and-forget 호출한다(app/actions/board.ts).
 */
export const getPostDetail = cache(async (postId: string): Promise<PostDetail | null> => {
  const supabase = await createClient();

  const [{ data: post, error: postError }, { data: comments }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, tag, title, content, view_count, created_at, author:profiles!posts_author_id_fkey(id, username, avatar_url)"
      )
      .eq("id", postId)
      .eq("is_deleted", false)
      .maybeSingle(),
    supabase
      .from("post_comments")
      .select(
        "id, content, created_at, author:profiles!post_comments_author_id_fkey(id, username, avatar_url)"
      )
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true }),
  ]);

  if (postError || !post) {
    return null;
  }

  const postRow = post as unknown as {
    id: string;
    tag: string;
    title: string;
    content: string;
    view_count: number;
    created_at: string;
    author: { id: string; username: string | null; avatar_url: string | null } | null;
  };

  if (!postRow.author) {
    return null;
  }

  const commentRows = (comments ?? []) as unknown as PostCommentRow[];

  return {
    id: postRow.id,
    tag: postRow.tag as PostTag,
    title: postRow.title,
    content: postRow.content,
    authorId: postRow.author.id,
    authorNickname: postRow.author.username ?? "알 수 없음",
    authorAvatarUrl: postRow.author.avatar_url,
    viewCount: postRow.view_count,
    createdAt: postRow.created_at,
    comments: commentRows
      .filter((row) => row.author !== null)
      .map((row) => ({
        id: row.id,
        authorId: row.author!.id,
        authorNickname: row.author!.username ?? "알 수 없음",
        authorAvatarUrl: row.author!.avatar_url,
        content: row.content,
        createdAt: row.created_at,
      })),
  };
});
