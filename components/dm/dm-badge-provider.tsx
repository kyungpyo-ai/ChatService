"use client";

import { createContext, useContext } from "react";
import { useDmUnreadBadge } from "@/lib/realtime/dm-badge";

const DmBadgeContext = createContext<number>(0);

interface DmBadgeProviderProps {
  userId: string | null;
  initialCount: number;
  children: React.ReactNode;
}

/**
 * 쪽지함 안읽음 배지 Realtime 구독을 앱 최상위(`app/layout.tsx`)에 딱 한 번만 마운트한다
 * (§ROADMAP Phase 11 후속 개선, 2026-08-18 재현으로 확정).
 *
 * 원래는 `(main)/layout.tsx`의 `MainNav`가 이 구독을 갖고 있었는데, `/random`(=`(chat)`
 * route group)으로 이동하면 `(main)` 레이아웃 전체가 언마운트되며 이 구독도 완전히 끊겼다가,
 * 다시 `(main)`으로 돌아올 때 재마운트되어야 했다. 그런데 실제로 Playwright + WebSocket 프레임
 * 캡처로 확인한 결과, 이 재마운트 타이밍에 두 가지가 경쟁한다:
 *
 * 1. `MainNav`가 없어져 채널이 0개가 되면 `@supabase/realtime-js`가 소켓을 자동으로 닫는다.
 * 2. 그 소켓의 내부 자동 재연결(backoff) 타이머가 뒤늦게 발동해 채널이 비어있는 상태로
 *    소켓을 다시 열었다가 곧바로 다시 닫는다.
 *
 * 이 두 동작이 겹치면, `MainNav`가 재마운트되며 새로 시도하는 `channel().subscribe()`가
 * 서버의 `phx_reply`를 영원히 못 받고 클라이언트 자체 타임아웃(10초)까지 `TIMED_OUT`으로
 * 남아있는 것을 실제로 재현했다 — `realtime.connect()`를 구독 직전에 강제로 호출해도
 * 마찬가지였다(자동 재연결 타이머와 경쟁하는 구조라 근본적으로 안 고쳐짐).
 *
 * 근본 해결책은 "재마운트 자체가 없게" 만드는 것이다. 이 Provider를 라우트 그룹과 무관한
 * 앱 최상위 레이아웃에 두면 `/random`을 오가도 절대 언마운트되지 않으므로, 소켓의 채널
 * 수가 0으로 떨어지는 순간 자체가 사라져 위 경쟁 상태가 원천적으로 발생하지 않는다.
 *
 * `MainNav`(및 향후 배지를 표시할 다른 컴포넌트)는 `useDmBadgeCount()`로 이 값을 구독만
 * 하면 된다 — 실제 Realtime 연결의 존재 여부는 몰라도 된다.
 */
export function DmBadgeProvider({ userId, initialCount, children }: DmBadgeProviderProps) {
  const count = useDmUnreadBadge(initialCount, userId);

  return <DmBadgeContext.Provider value={count}>{children}</DmBadgeContext.Provider>;
}

/** 쪽지함 안읽음 개수를 구독한다 — 값의 출처(Realtime/폴링/서버 재검증)는 신경 쓰지 않아도 된다. */
export function useDmBadgeCount(): number {
  return useContext(DmBadgeContext);
}
