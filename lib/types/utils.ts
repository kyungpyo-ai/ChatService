/**
 * 유틸리티 타입 정의
 *
 * 재사용 가능한 제네릭 타입과 타입 가드 함수를 정의합니다.
 */

import type { ApiError } from "./api";

/**
 * 생성 입력 데이터 타입
 *
 * 엔티티 생성 시 사용하는 타입입니다.
 * ID와 타임스탬프 필드를 제외한 나머지 필드만 포함합니다.
 *
 * @template T - 기본 엔티티 타입 (id 필드를 가진 타입)
 *
 * @example
 * ```typescript
 * // User 생성 시
 * type CreateUserInput = CreateInput<User>
 * // { email: string; name: string; avatar_url: string | null; role: 'user' | 'admin' }
 *
 * const newUser: CreateUserInput = {
 *   email: 'user@example.com',
 *   name: '홍길동',
 *   avatar_url: null,
 *   role: 'user'
 * }
 * ```
 */
export type CreateInput<T extends { id: string }> = Omit<T, "id" | "created_at" | "updated_at">;

/**
 * 업데이트 입력 데이터 타입
 *
 * 엔티티 업데이트 시 사용하는 타입입니다.
 * ID와 타임스탬프를 제외한 모든 필드가 선택적(optional)입니다.
 *
 * @template T - 기본 엔티티 타입
 *
 * @example
 * ```typescript
 * // User 업데이트 시
 * type UpdateUserInput = UpdateInput<User>
 * // { email?: string; name?: string; avatar_url?: string | null; role?: 'user' | 'admin' }
 *
 * const updateData: UpdateUserInput = {
 *   name: '김철수' // 이름만 업데이트
 * }
 * ```
 */
export type UpdateInput<T> = Partial<Omit<T, "id" | "created_at" | "updated_at">>;

/**
 * 폼 상태 관리 타입
 *
 * 폼의 데이터, 에러, 제출 상태를 관리하는 타입입니다.
 *
 * @template T - 폼 데이터 타입
 * @property data - 폼 입력 데이터
 * @property errors - 필드별 에러 메시지 (필드명을 키로 사용)
 * @property isSubmitting - 제출 중 여부
 * @property isValid - 폼 유효성 검사 통과 여부
 *
 * @example
 * ```typescript
 * const formState: FormState<EventFormData> = {
 *   data: { title: '', description: '', location: '', event_date: '' },
 *   errors: { title: '제목을 입력해주세요' },
 *   isSubmitting: false,
 *   isValid: false
 * }
 * ```
 */
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * 비동기 상태 타입 (Discriminated Union)
 *
 * 비동기 작업의 상태를 타입 안전하게 관리합니다.
 * discriminated union 패턴을 사용하여 각 상태에서 접근 가능한 속성이 다릅니다.
 *
 * @template T - 성공 시 반환되는 데이터 타입
 *
 * 상태 종류:
 * - idle: 초기 상태 (아직 요청하지 않음)
 * - loading: 로딩 중
 * - success: 성공 (data 포함)
 * - error: 에러 (error 정보 포함)
 *
 * @example
 * ```typescript
 * const [state, setState] = useState<AsyncState<Event>>({ status: 'idle' })
 *
 * // 로딩 시작
 * setState({ status: 'loading' })
 *
 * // 성공
 * setState({ status: 'success', data: event })
 *
 * // 에러
 * setState({ status: 'error', error: { code: 'NOT_FOUND', message: '이벤트를 찾을 수 없습니다' } })
 *
 * // 타입 가드 활용
 * if (isSuccess(state)) {
 *   console.log(state.data) // TypeScript가 data 존재를 보장
 * }
 * ```
 */
export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: ApiError };

/**
 * 성공 상태 타입 가드 함수
 *
 * AsyncState가 성공 상태인지 확인하고, TypeScript에게 타입을 좁혀줍니다.
 *
 * @template T - 데이터 타입
 * @param state - 확인할 비동기 상태
 * @returns 성공 상태이면 true, 아니면 false
 *
 * @example
 * ```typescript
 * if (isSuccess(state)) {
 *   // 이 블록 안에서 state.data에 안전하게 접근 가능
 *   console.log(state.data.title)
 * }
 * ```
 */
export function isSuccess<T>(state: AsyncState<T>): state is { status: "success"; data: T } {
  return state.status === "success";
}

/**
 * 에러 상태 타입 가드 함수
 *
 * AsyncState가 에러 상태인지 확인하고, TypeScript에게 타입을 좁혀줍니다.
 *
 * @template T - 데이터 타입
 * @param state - 확인할 비동기 상태
 * @returns 에러 상태이면 true, 아니면 false
 *
 * @example
 * ```typescript
 * if (isError(state)) {
 *   // 이 블록 안에서 state.error에 안전하게 접근 가능
 *   console.error(state.error.message)
 * }
 * ```
 */
export function isError<T>(state: AsyncState<T>): state is { status: "error"; error: ApiError } {
  return state.status === "error";
}
