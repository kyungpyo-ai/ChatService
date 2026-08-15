/**
 * 날짜 범위 계산 헬퍼 함수
 *
 * 관리자 대시보드 지표 및 통계 차트에서 사용하는
 * 날짜 범위 계산 유틸리티를 제공합니다.
 */

/**
 * 오늘 날짜 범위 반환 (00:00:00 ~ 현재 시각)
 *
 * 대시보드에서 "오늘 생성된 이벤트/사용자" 집계에 사용됩니다.
 *
 * @returns {Object} start: 오늘 00시 (ISO), end: 현재 시각 (ISO)
 *
 * @example
 * ```typescript
 * const { start, end } = getTodayRange();
 * // start: "2025-01-20T00:00:00.000Z"
 * // end: "2025-01-20T14:30:00.000Z"
 *
 * // Supabase 쿼리에 사용
 * const { data } = await supabase
 *   .from('events')
 *   .select('*', { count: 'exact', head: true })
 *   .gte('created_at', start)
 *   .lte('created_at', end);
 * ```
 */
export function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.setHours(0, 0, 0, 0));

  return {
    start: start.toISOString(),
    end: new Date().toISOString(),
  };
}

/**
 * N일 전 날짜 반환
 *
 * "이번 주", "이번 달" 등의 기간별 집계에 사용됩니다.
 *
 * @param {number} days - 몇 일 전인지 (예: 7 = 일주일 전, 30 = 한 달 전)
 * @returns {string} ISO 형식 날짜 문자열
 *
 * @example
 * ```typescript
 * const weekAgo = getDateRangeFromDays(7);
 * // "2025-01-13T14:30:00.000Z"
 *
 * const monthAgo = getDateRangeFromDays(30);
 * // "2024-12-21T14:30:00.000Z"
 *
 * // Supabase 쿼리에 사용
 * const { data } = await supabase
 *   .from('events')
 *   .select('*', { count: 'exact', head: true })
 *   .gte('created_at', weekAgo);
 * ```
 */
export function getDateRangeFromDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

/**
 * 최근 N일 날짜 배열 생성
 *
 * 통계 차트에서 X축 날짜 배열을 생성하는데 사용됩니다.
 * 과거부터 오늘까지 연속된 날짜를 'YYYY-MM-DD' 형식으로 반환합니다.
 *
 * @param {number} days - 생성할 날짜 일수 (기본값: 30일)
 * @returns {string[]} 'YYYY-MM-DD' 형식 날짜 배열
 *
 * @example
 * ```typescript
 * const dates = getRecentDates(7);
 * // [
 * //   '2025-01-14',
 * //   '2025-01-15',
 * //   '2025-01-16',
 * //   '2025-01-17',
 * //   '2025-01-18',
 * //   '2025-01-19',
 * //   '2025-01-20'
 * // ]
 *
 * // 차트 데이터 생성 예시
 * const chartData = dates.map(date => ({
 *   date,
 *   value: eventCountsByDate[date] || 0
 * }));
 * ```
 */
export function getRecentDates(days: number = 30): string[] {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return date.toISOString().split("T")[0];
  });
}

/**
 * 채팅 메시지 시각 표시 포맷 ("오후 8:30") — 서버 쿼리와 클라이언트 Realtime 훅에서 공통 사용
 */
export function formatChatTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * 채팅 메시지 목록의 날짜 구분선 표시 포맷 ("2026년 8월 15일 토요일")
 */
export function formatChatDate(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/**
 * 같은 로컬 날짜(연/월/일)인지 비교한다 — 채팅 메시지 목록에서 날짜가 바뀔 때만
 * 구분선을 넣기 위해 사용한다.
 */
export function isSameLocalDate(a: string, b: string): boolean {
  const dateA = new Date(a);
  const dateB = new Date(b);
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}
