/**
 * 타입 정의 중앙 집중식 export
 *
 * 모든 타입 정의를 한 곳에서 import할 수 있도록 re-export합니다.
 *
 * @example
 * ```typescript
 * // 개별 import
 * import { User, Event } from '@/lib/types'
 *
 * // 여러 타입 한번에 import
 * import type { EventWithHost, EventCardProps, NavItem } from '@/lib/types'
 *
 * // 사용 예시
 * const event: EventWithHost = {
 *   id: '123',
 *   title: '개발자 모임',
 *   // ...
 *   host: { id: '456', name: '홍길동', avatar_url: null },
 *   participant_count: 10
 * }
 * ```
 */

// 도메인 모델 타입
export * from "./models";

// 컴포넌트 Props 타입
export * from "./components";

// API 응답 타입
export * from "./api";

// 유틸리티 타입
export * from "./utils";
