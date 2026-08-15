/**
 * 아바타 이미지 Storage 공용 상수 / 헬퍼 (클라이언트 전용)
 *
 * 경로 규칙: avatars/{user_id}.{ext} — 사용자당 파일 1개만 존재하도록 고정한다
 * (supabase/migrations/20260815020000_create_avatars_bucket_and_rls.sql과 동기화).
 * chat-images와 달리 공개 버킷이라 서명 URL 없이 getPublicUrl()만으로 조회한다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/** avatars 버킷명 */
export const AVATAR_BUCKET = "avatars";

/** 버킷 레벨 file_size_limit과 동일한 값(2MB) — 클라이언트 사전 검증용 */
export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024;

/** 버킷 레벨 allowed_mime_types와 동일한 값 */
export const AVATAR_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AvatarMimeType = (typeof AVATAR_ALLOWED_MIME_TYPES)[number];

/** MIME 타입 → 경로에 사용할 확장자 매핑 (jpeg는 jpg로 정규화) */
const AVATAR_MIME_TO_EXTENSION: Record<AvatarMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function isValidAvatarMimeType(mimeType: string): mimeType is AvatarMimeType {
  return (AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** 아바타 Storage 경로 생성 — 사용자당 고정 경로라 재업로드 시 upsert로 덮어쓴다 */
export function buildAvatarPath(userId: string, mimeType: AvatarMimeType): string {
  return `${userId}.${AVATAR_MIME_TO_EXTENSION[mimeType]}`;
}

export interface UploadAvatarResult {
  success: true;
  publicUrl: string;
}

export interface UploadAvatarError {
  success: false;
  message: string;
}

/**
 * 아바타 파일을 업로드하고 공개 URL을 반환한다.
 * 크기/형식 검증은 버킷 레벨(file_size_limit/allowed_mime_types)에서도 강제되지만,
 * 업로드 요청 자체를 보내기 전에 걸러 불필요한 왕복을 줄인다.
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<UploadAvatarResult | UploadAvatarError> {
  if (!isValidAvatarMimeType(file.type)) {
    return { success: false, message: "jpg, png, webp 형식의 이미지만 업로드할 수 있습니다." };
  }

  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    return { success: false, message: "이미지 크기는 2MB 이하여야 합니다." };
  }

  const path = buildAvatarPath(userId, file.type);

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { success: false, message: "아바타 업로드에 실패했습니다." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  // 같은 경로를 upsert로 덮어써도 URL 문자열 자체는 바뀌지 않아 브라우저/CDN 캐시가 이전
  // 이미지를 계속 보여줄 수 있다 — 캐시 무효화를 위해 쿼리스트링에 타임스탬프를 붙인다.
  return { success: true, publicUrl: `${publicUrl}?t=${Date.now()}` };
}
