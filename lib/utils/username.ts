/**
 * 닉네임 생성 유틸리티
 */

/**
 * OAuth 로그인 시 닉네임 자동 생성
 *
 * 사용자의 전체 이름에서 공백을 제거하고 랜덤 4자리 숫자를 추가합니다.
 * Google OAuth 로그인 시 user_metadata의 full_name을 사용하여
 * 중복되지 않는 기본 닉네임을 제안합니다.
 *
 * @param fullName - 사용자 전체 이름
 * @returns 생성된 닉네임 (공백 제거 + 랜덤 4자리)
 *
 * @example
 * ```typescript
 * generateUsername("김민준") // "김민준1234"
 * generateUsername("John Doe") // "JohnDoe5678"
 * generateUsername("이 지 은") // "이지은9012"
 * ```
 */
export function generateUsername(fullName: string): string {
  // 공백 제거
  const baseUsername = fullName.replace(/\s+/g, "");

  // 랜덤 4자리 숫자 생성 (1000~9999)
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);

  return `${baseUsername}${randomSuffix}`;
}
