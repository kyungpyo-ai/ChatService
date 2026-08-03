/**
 * 최근 검색어 localStorage 헬퍼
 *
 * 서버 저장 요구가 없어(§4.4.0) 브라우저 로컬 전용으로만 관리한다.
 */

const STORAGE_KEY = "sudaon:recent-searches";
const MAX_ITEMS = 8;

/**
 * 최근 검색어 목록 조회 (최신순)
 */
export function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/**
 * 검색어를 최근 검색어 목록 맨 앞에 추가한다.
 * 중복 검색어는 제거 후 맨 앞으로 이동시키고, 최대 개수를 넘으면 오래된 항목부터 제거한다.
 */
export function addRecentSearch(term: string): void {
  if (typeof window === "undefined") return;

  const trimmed = term.trim();
  if (!trimmed) return;

  try {
    const current = getRecentSearches().filter((item) => item !== trimmed);
    const next = [trimmed, ...current].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage 접근 실패(프라이빗 모드 등)는 조용히 무시한다.
  }
}

/**
 * 최근 검색어 전체 삭제
 */
export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage 접근 실패는 조용히 무시한다.
  }
}
