/**
 * 메시지 전송 Server Action (텍스트 전용 — 이미지 전송은 Phase 6)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 방채팅 텍스트 메시지 전송
 *
 * 권한(참여자 여부)은 messages 테이블의 INSERT RLS 정책이 최종 방어선이므로
 * 이 액션은 로그인 여부만 확인하고 나머지는 DB에 위임한다.
 */
export async function sendRoomMessageAction(
  roomId: string,
  content: string
): Promise<ActionResult> {
  const trimmed = content.trim();

  if (!trimmed) {
    return { success: false, message: "메시지를 입력해주세요." };
  }

  try {
    const supabase = await createClient();

    // getUser()는 Auth 서버에 네트워크 왕복을 하는 세션 재검증 API라 지연이 크다.
    // 이 액션은 로그인 여부 확인과 sender_id 추출만 필요하고, 참여자 권한 검증은
    // 어차피 messages INSERT RLS(room_members 확인)가 최종 방어선이므로
    // 네트워크 왕복 없이 로컬에서 JWT 서명만 검증하는 getClaims()로 충분하다.
    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { error: insertError } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_id: userId,
      content_type: "text",
      content: trimmed,
    });

    if (insertError) {
      return { success: false, message: "메시지 전송에 실패했습니다." };
    }

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "메시지 전송 중 오류가 발생했습니다." };
  }
}
