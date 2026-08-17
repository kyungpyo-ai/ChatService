/**
 * 쪽지(DM) 관련 Server Actions (§ROADMAP Phase 11)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getOlderDmMessagesForViewer } from "@/lib/queries/dm";
import { isStaleSessionError } from "@/lib/utils/stale-session";
import type { ActionResult } from "@/lib/types/forms";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";

const SESSION_EXPIRED_MESSAGE =
  "로그인 세션이 만료되어 자동으로 로그아웃했어요. 새로고침 후 다시 시도해주세요.";

/**
 * 대화 시작 또는 기존 대화 조회 — start_or_get_dm_conversation() SECURITY DEFINER 함수가
 * 로그인/게스트 여부·정지 여부·자기 자신 여부·상대 존재 여부를 전부 재검증하고, 정규화된
 * (user_a_id, user_b_id) unique 제약 덕분에 동시 요청에도 항상 같은 대화 id로 수렴한다.
 */
export async function startOrGetDmConversationAction(
  targetUserId: string
): Promise<ActionResult<{ conversationId: string }>> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { data: conversationId, error: rpcError } = await supabase.rpc(
      "start_or_get_dm_conversation",
      { p_target_user_id: targetUserId }
    );

    if (rpcError || !conversationId) {
      const message = rpcError?.message.includes("cannot_dm_self")
        ? "자기 자신에게는 쪽지를 보낼 수 없습니다."
        : rpcError?.message.includes("guest_cannot_send_dm")
          ? "게스트는 쪽지를 보낼 수 없습니다. 로그인해주세요."
          : rpcError?.message.includes("target_not_found")
            ? "상대를 찾을 수 없습니다."
            : rpcError?.message.includes("user_suspended")
              ? "이용이 정지된 계정입니다."
              : "대화를 시작하지 못했습니다.";

      return { success: false, message };
    }

    return { success: true, message: "", data: { conversationId } };
  } catch {
    return { success: false, message: "대화를 시작하는 중 오류가 발생했습니다." };
  }
}

/**
 * DM 텍스트 메시지 전송
 *
 * sendRoomMessageAction과 동일하게 로그인 여부만 확인하고, 참여자 권한 검증은 messages
 * INSERT RLS("dm participants can send dm messages")가 최종 방어선이다.
 */
export async function sendDmMessageAction(
  conversationId: string,
  content: string
): Promise<ActionResult> {
  const trimmed = content.trim();

  if (!trimmed) {
    return { success: false, message: "메시지를 입력해주세요." };
  }

  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const withinRateLimit = await checkRateLimit(supabase, "send_message");
    if (!withinRateLimit) {
      return {
        success: false,
        message: "메시지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    const { error: insertError } = await supabase.from("messages").insert({
      dm_conversation_id: conversationId,
      sender_id: userId,
      content_type: "text",
      content: trimmed,
    });

    if (insertError) {
      if (isStaleSessionError(insertError)) {
        await supabase.auth.signOut();
        return { success: false, message: SESSION_EXPIRED_MESSAGE, sessionExpired: true };
      }
      return { success: false, message: "메시지 전송에 실패했습니다." };
    }

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "메시지 전송 중 오류가 발생했습니다." };
  }
}

/**
 * "이전 대화 더 보기" — 대화 참여자 검증까지 getOlderDmMessagesForViewer가 함께 수행한다.
 */
export async function loadOlderDmMessagesAction(
  conversationId: string,
  beforeCreatedAt: string
): Promise<ActionResult<{ messages: ChatMessage[]; hasMore: boolean }>> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const result = await getOlderDmMessagesForViewer(conversationId, beforeCreatedAt, userId);
    if (!result) {
      return { success: false, message: "대화를 찾을 수 없습니다." };
    }

    return { success: true, message: "", data: result };
  } catch {
    return { success: false, message: "이전 대화를 불러오지 못했습니다." };
  }
}
