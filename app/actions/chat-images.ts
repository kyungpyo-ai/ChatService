/**
 * 채팅 이미지 업로드용 서명 URL 발급 Server Action (Phase 6)
 *
 * 실제 파일 바이트는 서버를 거치지 않는다 — Next.js 서버 액션 body 기본 상한(1MB)보다
 * 이미지 최대 용량(5MB)이 커서, 이 액션은 "업로드 허가"만 내주고 클라이언트가 발급받은
 * 서명 URL로 Storage에 직접 업로드한다(§DEVELOPMENT_PLAN 6.1 (2)).
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  buildChatImagePath,
  isValidChatImageExtension,
  type ChatImageContext,
} from "@/lib/storage/chat-images";
import { CHAT_IMAGES_BUCKET } from "@/lib/storage/chat-images";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import type { ActionResult } from "@/lib/types/forms";

export interface ChatImageUploadTicket {
  path: string;
  token: string;
}

/**
 * 채팅 이미지 업로드 URL 발급
 *
 * 1. getClaims()로 로그인(익명 포함) 확인
 * 2. 참여자 여부 재검증 — 방은 is_room_member() RPC, 세션은 select 자체가 이미
 *    RLS(참여자만 조회 가능)로 걸러지므로 조회 결과 유무로 판단한다.
 * 3. UUID 기반 경로 생성 후 createSignedUploadUrl() 발급
 *
 * 여기서 참여자 검증을 통과했더라도, 최종 방어선은 Storage INSERT RLS(§M3)다 — 이 액션은
 * 사용자에게 조기에 명확한 에러 메시지를 보여주기 위한 선제 검증일 뿐이다.
 */
export async function createChatImageUploadUrlAction(
  context: ChatImageContext,
  id: string,
  ext: string
): Promise<ActionResult<ChatImageUploadTicket>> {
  if (context !== "rooms" && context !== "sessions") {
    return { success: false, message: "잘못된 요청입니다." };
  }

  if (!isValidChatImageExtension(ext)) {
    return { success: false, message: "지원하지 않는 이미지 형식입니다." };
  }

  try {
    const supabase = await createClient();

    const { data: claimsData, error: authError } = await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const withinRateLimit = await checkRateLimit(supabase, "upload_image");
    if (!withinRateLimit) {
      return {
        success: false,
        message: "이미지 업로드 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    if (context === "rooms") {
      const { data: isMember, error: memberError } = await supabase.rpc("is_room_member", {
        p_room_id: id,
      });

      if (memberError || !isMember) {
        return { success: false, message: "참여 중인 방이 아닙니다." };
      }
    } else {
      const { data: session, error: sessionError } = await supabase
        .from("random_sessions")
        .select("id, status")
        .eq("id", id)
        .maybeSingle();

      // random_sessions SELECT RLS가 참여자만 조회 가능하도록 이미 막고 있으므로,
      // 행을 못 받으면 비참여자이거나 존재하지 않는 세션이다.
      if (sessionError || !session || session.status !== "active") {
        return { success: false, message: "참여 중인 대화가 아니거나 이미 종료되었습니다." };
      }
    }

    const path = buildChatImagePath(context, id, ext);

    const { data: signed, error: signError } = await supabase.storage
      .from(CHAT_IMAGES_BUCKET)
      .createSignedUploadUrl(path);

    if (signError || !signed) {
      return { success: false, message: "업로드 URL 발급에 실패했습니다." };
    }

    return {
      success: true,
      message: "",
      data: { path: signed.path, token: signed.token },
    };
  } catch {
    return { success: false, message: "업로드 준비 중 오류가 발생했습니다." };
  }
}
