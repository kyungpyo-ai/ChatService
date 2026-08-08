/**
 * 채팅 이미지 Storage 공용 상수 / 헬퍼 (서버·클라이언트 공용)
 *
 * 경로 규칙(§DEVELOPMENT_PLAN 6.1): 첫 세그먼트로 컨텍스트(rooms|sessions)를 구분해야
 * Storage RLS 정책이 어느 테이블(rooms/room_members 또는 random_sessions)을 조회할지
 * 판별할 수 있다.
 *
 *   chat-images/rooms/{room_id}/{uuid}.{ext}
 *   chat-images/sessions/{session_id}/{uuid}.{ext}
 *
 * 이 파일은 클라이언트 번들에도 포함될 수 있으므로 서버 전용 값(서비스 롤 키 등)을 담지 않는다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** chat-images 버킷명 (supabase/migrations/20260808000000_create_chat_images_bucket.sql과 동기화) */
export const CHAT_IMAGES_BUCKET = "chat-images";

/** 버킷 레벨 file_size_limit과 동일한 값(5MB) — 클라이언트 사전 검증용 */
export const CHAT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** 버킷 레벨 allowed_mime_types와 동일한 값 */
export const CHAT_IMAGE_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ChatImageMimeType = (typeof CHAT_IMAGE_ALLOWED_MIME_TYPES)[number];

/** MIME 타입 → 경로에 사용할 확장자 매핑 (jpeg는 jpg로 정규화) */
export const CHAT_IMAGE_MIME_TO_EXTENSION: Record<ChatImageMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** 경로에 허용되는 확장자 화이트리스트 (buildChatImagePath/parseChatImagePath 공용 검증) */
export const CHAT_IMAGE_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

export type ChatImageContext = "rooms" | "sessions";

/** Storage RLS 정책과 동일한 uuid v4 형식 정규식 (대소문자 구분 없음) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidChatImageMimeType(mimeType: string): mimeType is ChatImageMimeType {
  return (CHAT_IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

export function isValidChatImageExtension(ext: string): boolean {
  return (CHAT_IMAGE_ALLOWED_EXTENSIONS as readonly string[]).includes(ext.toLowerCase());
}

/**
 * 채팅 이미지 Storage 경로 생성 — 매번 새 uuid를 파일명으로 사용해 경로 충돌/추측을 방지한다.
 */
export function buildChatImagePath(context: ChatImageContext, id: string, ext: string): string {
  const normalizedExt = ext.toLowerCase();
  if (!isValidChatImageExtension(normalizedExt)) {
    throw new Error(`허용되지 않는 이미지 확장자입니다: ${ext}`);
  }
  return `${context}/${id}/${crypto.randomUUID()}.${normalizedExt}`;
}

export interface ParsedChatImagePath {
  context: ChatImageContext;
  id: string;
  filename: string;
}

/**
 * 채팅 이미지 Storage 경로 파싱 — 형식이 규칙과 다르면 null (메시지 전송 액션에서
 * 클라이언트가 임의로 만든 경로를 거부하는 데 사용).
 */
export function parseChatImagePath(path: string): ParsedChatImagePath | null {
  const segments = path.split("/");
  if (segments.length !== 3) {
    return null;
  }

  const [context, id, filename] = segments;
  if (context !== "rooms" && context !== "sessions") {
    return null;
  }
  if (!UUID_REGEX.test(id)) {
    return null;
  }

  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(filename);
  if (!extMatch || !isValidChatImageExtension(extMatch[1])) {
    return null;
  }

  return { context, id, filename };
}

/** 서명 URL 기본 유효기간 — §DEVELOPMENT_PLAN 6.1 (4) 조회 정책과 동일하게 1시간 */
export const CHAT_IMAGE_SIGNED_URL_TTL_SECONDS = 60 * 60;

/**
 * 채팅 이미지 경로 목록에 대한 서명 URL을 한 번에 배치 발급한다.
 * 메시지마다 개별 발급하지 않도록 초기 로드(getRoomMessages/getRandomMessages)에서 사용한다.
 * 발급 실패한 경로는 결과 Map에서 제외된다(호출부에서 imageUrl: null로 처리).
 */
export async function getSignedChatImageUrls(
  supabase: SupabaseClient,
  paths: string[],
  expiresInSeconds: number = CHAT_IMAGE_SIGNED_URL_TTL_SECONDS
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (paths.length === 0) {
    return result;
  }

  const { data, error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrls(paths, expiresInSeconds);

  if (error || !data) {
    return result;
  }

  for (const item of data) {
    if (!item.error && item.signedUrl) {
      result.set(item.path ?? "", item.signedUrl);
    }
  }

  return result;
}

/**
 * 채팅 이미지 경로 1건에 대한 서명 URL 단건 발급 — Realtime으로 새 이미지 메시지가 도착했을 때
 * 클라이언트가 직접 호출한다. Storage SELECT RLS가 참여자 여부를 검증하므로 안전하다.
 */
export async function getSignedChatImageUrl(
  supabase: SupabaseClient,
  path: string,
  expiresInSeconds: number = CHAT_IMAGE_SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    return null;
  }

  return data.signedUrl;
}
