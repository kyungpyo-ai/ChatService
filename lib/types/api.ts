/**
 * API 응답 타입 정의
 *
 * API 통신에서 사용하는 표준 응답 타입을 정의합니다.
 */

/**
 * 표준 API 응답 래퍼
 *
 * 모든 API 응답은 이 구조를 따릅니다.
 *
 * @template T - 응답 데이터 타입 (제네릭)
 * @property data - 성공 시 반환되는 데이터 (선택적)
 * @property error - 에러 발생 시 에러 정보 (선택적)
 * @property message - 추가 메시지 (선택적)
 *
 * @example
 * ```typescript
 * const response: ApiResponse<Event> = {
 *   data: { id: '123', title: '개발자 모임', ... }
 * }
 * ```
 */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  message?: string;
}

/**
 * API 에러 응답 구조
 *
 * 에러 발생 시 반환되는 표준 에러 정보입니다.
 *
 * @property code - 에러 코드 (예: 'NOT_FOUND', 'UNAUTHORIZED')
 * @property message - 사용자에게 표시할 에러 메시지
 * @property details - 추가 에러 상세 정보 (선택적)
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 페이지네이션 파라미터
 *
 * 목록 조회 시 페이징 처리를 위한 파라미터입니다.
 *
 * @property page - 현재 페이지 번호 (1부터 시작)
 * @property limit - 페이지당 항목 수
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * 페이지네이션 응답
 *
 * 페이징 처리된 목록 응답 구조입니다.
 *
 * @template T - 목록 항목 타입 (제네릭)
 * @property data - 현재 페이지의 데이터 배열
 * @property pagination - 페이지네이션 메타데이터
 * @property pagination.page - 현재 페이지 번호
 * @property pagination.limit - 페이지당 항목 수
 * @property pagination.total - 전체 항목 수
 * @property pagination.total_pages - 전체 페이지 수
 *
 * @example
 * ```typescript
 * const response: PaginatedResponse<Event> = {
 *   data: [{ id: '1', ... }, { id: '2', ... }],
 *   pagination: { page: 1, limit: 10, total: 25, total_pages: 3 }
 * }
 * ```
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * 정렬 옵션
 *
 * 목록 조회 시 정렬 방식을 지정합니다.
 *
 * @property field - 정렬 기준 필드명
 * @property order - 정렬 순서 ('asc': 오름차순, 'desc': 내림차순)
 */
export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

