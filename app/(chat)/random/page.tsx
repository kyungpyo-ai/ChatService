import type { Metadata } from "next";
import { RandomMatchingClient } from "@/components/random/random-matching-client";

export const metadata: Metadata = {
  title: "랜덤채팅 — 로그인 없이 바로 시작 | 달나루",
  description:
    "로그인 없는 무료 랜덤채팅. 버튼 한 번으로 새로운 사람과 바로 익명채팅을 시작해보세요.",
};

/**
 * 랜덤채팅 매칭 대기 화면 — 서버에서 조회할 데이터가 없어 클라이언트 컴포넌트를
 * 렌더링하는 얇은 래퍼로만 구성한다(익명 로그인/매칭 요청은 모두 클라이언트 훅에서 처리).
 */
export default function RandomMatchingPage() {
  return <RandomMatchingClient />;
}
