/**
 * 메시지 전송 Server Action (텍스트 + 이미지)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  CHAT_IMAGES_BUCKET,
  CHAT_IMAGE_ALLOWED_MIME_TYPES,
  CHAT_IMAGE_MAX_SIZE_BYTES,
  parseChatImagePath,
} from "@/lib/storage/chat-images";
import type { ActionResult } from "@/lib/types/forms";
import type { SupabaseClient } from "@supabase/supabase-js";

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

/**
 * 랜덤채팅 텍스트 메시지 전송
 *
 * sendRoomMessageAction과 동일하게 getClaims()로 로그인(익명 포함) 여부만 확인하고,
 * 세션 참여자 여부·세션 활성 상태 검증은 messages INSERT RLS(§DB_SCHEMA 7)가 최종 방어선이다.
 */
export async function sendRandomMessageAction(
  sessionId: string,
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

    const { error: insertError } = await supabase.from("messages").insert({
      session_id: sessionId,
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

/**
 * 업로드된 오브젝트가 실제로 존재하고 size/mimetype이 버킷 정책 범위 안인지 재확인한다.
 *
 * createChatImageUploadUrlAction이 발급한 서명 URL로 클라이언트가 Storage에 직접 업로드하므로,
 * 서버는 업로드가 실제로 일어났는지·값이 조작되지 않았는지 이 시점에 처음 확인하게 된다.
 * Storage list()는 호출자의 RLS(SELECT 정책)를 그대로 따르므로, 참여자가 아니면 애초에
 * 목록 자체가 비어 보인다.
 */
async function verifyUploadedChatImage(
  supabase: SupabaseClient,
  folder: string,
  filename: string
): Promise<boolean> {
  const { data, error } = await supabase.storage.from(CHAT_IMAGES_BUCKET).list(folder, {
    search: filename,
  });

  if (error || !data) {
    return false;
  }

  const object = data.find((item) => item.name === filename);
  if (!object || !object.metadata) {
    return false;
  }

  const size = object.metadata.size as number | undefined;
  const mimetype = object.metadata.mimetype as string | undefined;

  if (typeof size !== "number" || size <= 0 || size > CHAT_IMAGE_MAX_SIZE_BYTES) {
    return false;
  }

  if (!mimetype || !(CHAT_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimetype)) {
    return false;
  }

  return true;
}

/**
 * 검증 실패 시 업로드된 오브젝트를 삭제한다 — 검증을 통과하지 못한 파일은 messages에도
 * INSERT되지 않고 Storage에도 남지 않는다(§DEVELOPMENT_PLAN 6.1 (2)).
 */
async function deleteUploadedChatImage(supabase: SupabaseClient, path: string): Promise<void> {
  await supabase.storage.from(CHAT_IMAGES_BUCKET).remove([path]);
}

/**
 * 방채팅 이미지 메시지 전송
 *
 * 1. 경로가 rooms/{roomId}/... 형식인지 검증
 * 2. 업로드된 오브젝트의 실존·size·mimetype 재확인
 * 3. messages INSERT (content_type='image', content=path)
 * 2~3 중 어디서든 실패하면 업로드된 오브젝트를 삭제하고 실패를 반환한다.
 */
export async function sendRoomImageMessageAction(
  roomId: string,
  path: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const parsed = parseChatImagePath(path);
    if (!parsed || parsed.context !== "rooms" || parsed.id !== roomId) {
      return { success: false, message: "잘못된 이미지 경로입니다." };
    }

    const verified = await verifyUploadedChatImage(supabase, `rooms/${roomId}`, parsed.filename);

    if (!verified) {
      await deleteUploadedChatImage(supabase, path);
      return { success: false, message: "이미지 업로드 확인에 실패했습니다." };
    }

    const { error: insertError } = await supabase.from("messages").insert({
      room_id: roomId,
      sender_id: userId,
      content_type: "image",
      content: path,
    });

    if (insertError) {
      await deleteUploadedChatImage(supabase, path);
      return { success: false, message: "이미지 메시지 전송에 실패했습니다." };
    }

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "이미지 메시지 전송 중 오류가 발생했습니다." };
  }
}

/**
 * 랜덤채팅 이미지 메시지 전송 — sendRoomImageMessageAction과 동일한 3단계 검증을
 * sessions/{sessionId}/... 경로 기준으로 수행한다.
 */
export async function sendRandomImageMessageAction(
  sessionId: string,
  path: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const parsed = parseChatImagePath(path);
    if (!parsed || parsed.context !== "sessions" || parsed.id !== sessionId) {
      return { success: false, message: "잘못된 이미지 경로입니다." };
    }

    const verified = await verifyUploadedChatImage(
      supabase,
      `sessions/${sessionId}`,
      parsed.filename
    );

    if (!verified) {
      await deleteUploadedChatImage(supabase, path);
      return { success: false, message: "이미지 업로드 확인에 실패했습니다." };
    }

    const { error: insertError } = await supabase.from("messages").insert({
      session_id: sessionId,
      sender_id: userId,
      content_type: "image",
      content: path,
    });

    if (insertError) {
      await deleteUploadedChatImage(supabase, path);
      return { success: false, message: "이미지 메시지 전송에 실패했습니다." };
    }

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "이미지 메시지 전송 중 오류가 발생했습니다." };
  }
}
