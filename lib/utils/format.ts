/**
 * 날짜 및 텍스트 포맷팅 유틸리티
 */

/**
 * ISO 날짜 문자열을 한국어 형식으로 변환
 *
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns "2025년 1월 15일 오전 10:00" 형식의 문자열
 *
 * @example
 * formatDate("2025-01-15T10:00:00.000Z")
 * // => "2025년 1월 15일 오전 10:00"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * 날짜를 짧은 형식(YYYY-MM-DD)으로 포맷
 *
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns "YYYY-MM-DD" 형식의 문자열
 *
 * @example
 * formatDateShort("2025-01-15T10:00:00.000Z")
 * // => "2025-01-15"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * 닉네임에서 이니셜 추출 (최대 2자리)
 *
 * 한글: 첫 2글자 (예: "김민준" → "김민", "코치타임" → "코치")
 * 영문: 각 단어의 첫 글자 또는 첫 2글자 (예: "John Doe" → "JD", "CoachTime" → "CO")
 *
 * @param name - 사용자 닉네임 (null 허용)
 * @returns 최대 2자리의 이니셜 문자열
 *
 * @example
 * getInitials("김민준1234") // => "김민"
 * getInitials("CoachTime") // => "CO"
 * getInitials("John Doe") // => "JD"
 * getInitials("A") // => "A"
 * getInitials(null) // => ""
 */
export function getInitials(name: string | null): string {
  if (!name || name.trim().length === 0) {
    return "";
  }

  const trimmedName = name.trim();

  // 공백으로 단어 분리
  const words = trimmedName.split(/\s+/);

  // 여러 단어인 경우 각 단어의 첫 글자
  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  // 단일 단어인 경우 (주로 한글 이름)
  // 2자리까지 반환
  return trimmedName.slice(0, 2).toUpperCase();
}
