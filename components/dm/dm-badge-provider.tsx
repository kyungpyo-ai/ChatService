"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDmUnreadBadge } from "@/lib/realtime/dm-badge";

const DmBadgeContext = createContext<number>(0);

/**
 * 쪽지함 안읽음 배지 Realtime 구독을 앱 최상위(`app/layout.tsx`)에 딱 한 번만 마운트한다
 * (§ROADMAP Phase 11 후속 개선, 2026-08-18 재현으로 확정).
 *
 * ## 왜 userId를 서버 prop이 아니라 클라이언트에서 직접 구하는가 (§실사용 확인 2026-08-18)
 *
 * 처음엔 `app/layout.tsx`(Server Component)가 `getUser()`로 userId를 구해 prop으로
 * 내려줬는데, 실측해보니 로그인 직후에도 이 값이 계속 로그인 전(null) 상태로 고정되는
 * 회귀가 있었다. 원인: 로그인은 `signInWithPassword()` 후 `router.push("/")`로 이루어지는
 * **클라이언트 사이드 네비게이션**인데, Next.js App Router는 두 라우트가 공유하는 레이아웃을
 * 네비게이션 시 다시 렌더하지 않는다 — 루트 레이아웃은 로그인 페이지(`/auth/login`, 비로그인
 * 상태)에서 이미 한 번 렌더된 뒤로, 로그인 후 홈으로 이동해도 다시 실행되지 않아 계속 옛
 * (비로그인) 값을 들고 있었다. `export const dynamic = "force-dynamic"`을 걸어도 애초에
 * "다시 렌더 자체를 안 하는" 문제라 소용없었다.
 *
 * 그래서 userId는 클라이언트에서 `supabase.auth.getUser()` + `onAuthStateChange()`로
 * 직접, 반응형으로 추적한다 — 로그인/로그아웃이 실제로 일어나는 순간 즉시 갱신되고,
 * 서버 렌더 타이밍과 무관하다. 안읽음 초기값도 서버 prop 대신 userId가 확정된 직후
 * `useDmUnreadBadge`의 "마운트 시점 즉시 재동기화" 경로가 알아서 채워준다(잠깐 0으로
 * 보이는 깜빡임은 있을 수 있지만, 로그인 상태와 아예 안 맞는 값을 계속 보여주는 것보다 낫다).
 *
 * ## 왜 이 Provider 자체는 앱 최상위에 마운트하는가
 *
 * `/random`(=`(chat)` route group)으로 이동하면 `(main)` 레이아웃 전체가 언마운트되는데,
 * 예전에는 배지 구독이 `(main)/layout.tsx`의 `MainNav` 안에 있어서 이 구독도 같이 끊겼다가
 * 돌아올 때 재마운트되어야 했다. WebSocket 프레임을 직접 캡처해 확인한 결과, 채널이 0개가
 * 되어 소켓이 자동으로 닫히는 시점과 그 소켓의 내부 자동 재연결(backoff) 타이머가 뒤늦게
 * 발동하는 시점이 재마운트 시도와 경쟁해, 새 구독의 join 요청이 서버 응답을 영원히 못 받고
 * 10초 뒤 `TIMED_OUT`되는 것을 재현했다(`realtime.connect()` 강제 호출로도 경쟁 자체는
 * 없어지지 않았다). 이 Provider를 route group과 무관한 앱 최상위에 두면 `/random`을 오가도
 * 절대 언마운트되지 않으므로, 채널 수가 0으로 떨어지는 순간 자체가 없어져 이 문제가
 * 원천적으로 발생하지 않는다.
 */
export function DmBadgeProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setUserId(user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // 게스트(익명) 세션은 profiles가 아니라 guest_profiles에 저장되므로(§CLAUDE.md) userId만으로는
  // "쪽지를 쓸 수 있는 로그인 회원"인지 판별할 수 없다 — 하지만 게스트가 dm_notes의 recipient가
  // 될 일이 없으므로(쪽지 발송 자체가 회원 대상으로만 허용됨) 여기서는 신경 쓰지 않아도 된다.
  // 만약 게스트 계정으로 잘못 구독해도 recipient_id 필터에 매칭되는 행이 존재할 수 없다.
  const count = useDmUnreadBadge(0, userId);

  return <DmBadgeContext.Provider value={count}>{children}</DmBadgeContext.Provider>;
}

/** 쪽지함 안읽음 개수를 구독한다 — 값의 출처(Realtime/폴링/서버 재검증)는 신경 쓰지 않아도 된다. */
export function useDmBadgeCount(): number {
  return useContext(DmBadgeContext);
}
