/**
 * 게시판(사용자 커뮤니티 보드) 관련 Server Actions (§ROADMAP Phase 12)
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import type { ActionResult } from "@/lib/types/forms";
import type { PostTag } from "@/lib/queries/board";

function mapCreateErrorMessage(rpcErrorMessage: string | undefined): string {
  if (rpcErrorMessage?.includes("guest_cannot_post")) {
    return "게스트는 게시글을 작성할 수 없습니다. 로그인해주세요.";
  }
  if (rpcErrorMessage?.includes("user_suspended")) {
    return "이용이 정지된 계정입니다.";
  }
  if (rpcErrorMessage?.includes("empty_content")) {
    return "내용을 입력해주세요.";
  }
  return "작성에 실패했습니다.";
}

/**
 * 게시글 작성 — create_post() SECURITY DEFINER 함수가 로그인/게스트/정지 여부를 재검증한다.
 */
export async function createPostAction(
  tag: PostTag,
  title: string,
  content: string
): Promise<ActionResult<{ postId: string }>> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const withinRateLimit = await checkRateLimit(supabase, "send_message");
    if (!withinRateLimit) {
      return {
        success: false,
        message: "글을 너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    const { data: postId, error: rpcError } = await supabase.rpc("create_post", {
      p_tag: tag,
      p_title: title,
      p_content: content,
    });

    if (rpcError || !postId) {
      return { success: false, message: mapCreateErrorMessage(rpcError?.message) };
    }

    revalidatePath("/board");
    return { success: true, message: "게시글을 작성했습니다.", data: { postId } };
  } catch {
    return { success: false, message: "작성 중 오류가 발생했습니다." };
  }
}

/**
 * 게시글 삭제(소프트) — delete_post()가 작성자 본인 또는 관리자만 허용한다.
 */
export async function deletePostAction(postId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { error } = await supabase.rpc("delete_post", { p_post_id: postId });
    if (error) {
      return { success: false, message: "삭제에 실패했습니다." };
    }

    revalidatePath("/board");
    return { success: true, message: "게시글을 삭제했습니다." };
  } catch {
    return { success: false, message: "삭제 중 오류가 발생했습니다." };
  }
}

/**
 * 댓글 작성 — create_post_comment()가 로그인/게스트/정지/게시글 존재 여부를 재검증한다.
 */
export async function createPostCommentAction(
  postId: string,
  content: string
): Promise<ActionResult<{ commentId: string }>> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const withinRateLimit = await checkRateLimit(supabase, "send_message");
    if (!withinRateLimit) {
      return {
        success: false,
        message: "댓글을 너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    const { data: commentId, error: rpcError } = await supabase.rpc("create_post_comment", {
      p_post_id: postId,
      p_content: content,
    });

    if (rpcError || !commentId) {
      const message = rpcError?.message.includes("post_not_found")
        ? "게시글을 찾을 수 없습니다."
        : mapCreateErrorMessage(rpcError?.message);
      return { success: false, message };
    }

    revalidatePath(`/board/${postId}`);
    return { success: true, message: "댓글을 작성했습니다.", data: { commentId } };
  } catch {
    return { success: false, message: "댓글 작성 중 오류가 발생했습니다." };
  }
}

/**
 * 댓글 삭제(소프트) — delete_post_comment()가 작성자 본인 또는 관리자만 허용한다.
 */
export async function deletePostCommentAction(
  commentId: string,
  postId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { error } = await supabase.rpc("delete_post_comment", { p_comment_id: commentId });
    if (error) {
      return { success: false, message: "삭제에 실패했습니다." };
    }

    revalidatePath(`/board/${postId}`);
    return { success: true, message: "댓글을 삭제했습니다." };
  } catch {
    return { success: false, message: "삭제 중 오류가 발생했습니다." };
  }
}

/**
 * 조회수 증가 — 페이지 렌더와 무관한 부수효과라 상세 페이지 클라이언트 마운트 시
 * fire-and-forget으로 호출한다(실패해도 사용자에게 노출하지 않는다).
 */
export async function incrementPostViewCountAction(postId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("increment_post_view_count", { p_post_id: postId });
  } catch {
    // 조회수 증가 실패는 조용히 무시한다.
  }
}
