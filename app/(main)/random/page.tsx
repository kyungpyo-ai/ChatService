import { RandomMatchingClient } from "@/components/random/random-matching-client";

/**
 * 랜덤채팅 매칭 대기 화면 — 서버에서 조회할 데이터가 없어 클라이언트 컴포넌트를
 * 렌더링하는 얇은 래퍼로만 구성한다(익명 로그인/매칭 요청은 모두 클라이언트 훅에서 처리).
 */
export default function RandomMatchingPage() {
  return <RandomMatchingClient />;
}
