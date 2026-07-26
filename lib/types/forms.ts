/**
 * Server Actions 폼 관련 타입 정의
 *
 * Next.js 15.5.3 Server Actions에서 사용하는 폼 관련 타입을 정의합니다.
 */

/**
 * Server Action 실행 결과 타입
 *
 * Server Actions의 표준 반환 타입입니다.
 * React Hook Form과의 통합을 위해 errors 필드는 필드명을 키로 하는 에러 메시지 배열입니다.
 *
 * @template T - 성공 시 반환되는 데이터 타입 (제네릭)
 * @property success - 작업 성공 여부
 * @property message - 사용자에게 표시할 메시지
 * @property data - 성공 시 반환되는 데이터 (선택적)
 * @property errors - 실패 시 필드별 에러 메시지 (선택적)
 *
 * @example
 * ```typescript
 * // 성공 응답
 * const result: ActionResult<Event> = {
 *   success: true,
 *   message: '이벤트가 성공적으로 생성되었습니다.',
 *   data: { id: '123', title: '개발자 모임', ... }
 * }
 *
 * // 실패 응답
 * const result: ActionResult = {
 *   success: false,
 *   message: '이벤트 생성에 실패했습니다.',
 *   errors: {
 *     title: ['제목은 필수 항목입니다.'],
 *     event_date: ['유효한 날짜를 입력해주세요.']
 *   }
 * }
 * ```
 */
export type ActionResult<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

/**
 * Server Action 폼 상태 타입
 *
 * useActionState 훅과 함께 사용되는 폼 상태 타입입니다.
 *
 * @template T - 폼 데이터 타입 (제네릭)
 * @property status - 폼 상태 ('idle' | 'pending' | 'success' | 'error')
 * @property result - Server Action 실행 결과 (선택적)
 */
export type FormState<T = unknown> = {
  status: "idle" | "pending" | "success" | "error";
  result?: ActionResult<T>;
};
