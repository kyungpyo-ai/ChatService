/**
 * 컴포넌트 Props 타입 정의
 *
 * UI 컴포넌트에서 사용하는 Props 타입을 정의합니다.
 */

/**
 * 빈 상태 UI 컴포넌트 Props
 *
 * 데이터가 없거나 검색 결과가 없을 때 표시하는 컴포넌트입니다.
 *
 * @property icon - 표시할 아이콘 컴포넌트 (선택적)
 * @property title - 메인 메시지
 * @property description - 부가 설명 (선택적)
 * @property action - 실행 가능한 액션 (선택적)
 * @property action.label - 액션 버튼 라벨
 * @property action.onClick - 액션 버튼 클릭 핸들러
 */
export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 네비게이션 아이템
 *
 * 메뉴 또는 네비게이션 바에서 사용하는 항목 정보입니다.
 *
 * @property label - 표시할 텍스트
 * @property href - 이동할 경로
 * @property icon - 표시할 아이콘 컴포넌트
 * @property badge - 표시할 배지 숫자 (선택적, 알림 개수 등)
 */
export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}
