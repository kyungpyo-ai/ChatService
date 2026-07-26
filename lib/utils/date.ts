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
