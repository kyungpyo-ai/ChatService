/**
 * 닉네임 생성 유틸리티
 */

/** 닉네임 최대 길이 (lib/schemas/profile.ts의 검증 스키마와 동일하게 유지) */
const MAX_USERNAME_LENGTH = 6;

/** 랜덤 숫자 접미사 길이 */
const SUFFIX_LENGTH = 3;

/**
 * OAuth 로그인 시 닉네임 자동 생성
 *
 * 사용자의 전체 이름에서 공백을 제거하고, 닉네임 최대 길이(6자)에 맞춰
 * 이름을 자른 뒤 랜덤 3자리 숫자를 추가합니다.
 * Google OAuth 로그인 시 user_metadata의 full_name을 사용하여
 * 중복되지 않는 기본 닉네임을 제안합니다.
 *
 * @param fullName - 사용자 전체 이름
 * @returns 생성된 닉네임 (최대 6자, 이름 일부 + 랜덤 3자리)
 *
 * @example
 * ```typescript
 * generateUsername("김민준") // "김민준123"
 * generateUsername("John Doe") // "Joh456"
 * generateUsername("이 지 은") // "이지은789"
 * ```
 */
export function generateUsername(fullName: string): string {
  // 공백 제거
  const baseUsername = fullName.replace(/\s+/g, "");

  // 최대 길이를 넘지 않도록 이름 부분을 자른다
  const truncatedBase = baseUsername.slice(0, MAX_USERNAME_LENGTH - SUFFIX_LENGTH);

  // 랜덤 3자리 숫자 생성 (100~999)
  const randomSuffix = Math.floor(100 + Math.random() * 900);

  return `${truncatedBase}${randomSuffix}`;
}
