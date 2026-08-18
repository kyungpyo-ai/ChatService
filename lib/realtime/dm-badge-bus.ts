"use client";

/**
 * 쪽지 안읽음 배지 "지금 당장 다시 세줘" 신호 버스 (§ROADMAP Phase 11 후속 개선).
 *
 * `router.refresh()` + 서버 액션의 `revalidatePath("/", "layout")` 조합만으로는 Next.js
 * 라우터/데이터 캐시 타이밍에 따라 매번 확실하게 서버 재조회가 트리거된다는 보장이 약했다
 * (§실사용 확인 2026-08-18, "읽어도 새로고침해야 배지가 사라질 때가 있다"). 읽음 처리
 * (`markDmNoteReadAction`)/삭제(`hideDmNoteAction`)가 성공하면 이 버스로 신호를 보내,
 * `useDmUnreadBadge`가 `getDmUnreadCountAction()`을 즉시 직접 호출해 재동기화하도록 한다 —
 * `router.refresh()`는 그대로 유지하되(다른 서버 컴포넌트 데이터도 갱신해야 하므로) 그것
 * 하나만 믿지 않는다는 의미다.
 *
 * React Context/Provider 없이 모듈 스코프 pub-sub으로만 구현한다 — DM 페이지들과
 * `MainNav`가 모두 같은 (main) 레이아웃 아래 같은 클라이언트 번들을 공유하므로, 같은 탭
 * 안에서는 항상 같은 모듈 인스턴스(구독자 Set)를 참조한다. Provider 트리를 새로 만들 필요가
 * 없어 더 단순하고, 신호를 보낼 때마다 리렌더가 전파되는 Context 방식과 달리 실제 구독자
 * (badge 훅)만 반응한다.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** 읽음 처리/삭제가 성공했을 때 호출 — 구독 중인 모든 리스너(보통 useDmUnreadBadge 하나)에게 알린다 */
export function triggerDmBadgeResync(): void {
  listeners.forEach((listener) => listener());
}

/** useDmUnreadBadge가 마운트 시 구독하고, 언마운트 시 반환된 함수로 해제한다 */
export function subscribeDmBadgeResync(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
