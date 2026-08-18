"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDmUnreadCountAction } from "@/app/actions/dm";
import { subscribeDmBadgeResync } from "@/lib/realtime/dm-badge-bus";
import { generateTempId } from "@/lib/utils/temp-id";

// 배지 하나 세는 용도라 방채팅 하트비트(5~10초)처럼 자주 돌 필요는 없지만, "실시간이 조용히
// 죽어도 최대 이 정도면 맞는 값으로 돌아온다"는 안전망이므로 60초에서 20초로 좁혔다.
const RESYNC_INTERVAL_MS = 20_000;

/**
 * 쪽지함 안읽음 배지 실시간 갱신 (§ROADMAP Phase 11 후속 개선)
 *
 * 이 훅은 `components/dm/dm-badge-provider.tsx`를 통해 앱 최상위(`app/layout.tsx`)에 딱
 * 한 번만 마운트된다 — **route group을 오가도 절대 언마운트되지 않아야 한다.** 원래는
 * `(main)/layout.tsx`의 `MainNav` 안에 있었는데, `/random`(=`(chat)` route group)으로
 * 이동하면 `(main)` 레이아웃 전체가 언마운트되며 이 구독도 완전히 끊겼다가 돌아올 때
 * 재마운트되어야 했다. Playwright + 실제 테스트 계정으로 재현하고 WebSocket 프레임을
 * 직접 캡처해 확정한 근본 원인(§실사용 확인 2026-08-18, 상세 재현 로그는
 * `docs/DEVELOPMENT_PLAN.md` Phase 11 참고):
 *
 * 1. `MainNav`가 언마운트되어 채널이 0개가 되면 `@supabase/realtime-js`가 소켓을 자동으로
 *    닫는다.
 * 2. 그 소켓의 내부 자동 재연결(backoff) 타이머가 뒤늦게 발동해, 채널이 하나도 없는 상태로
 *    소켓을 다시 열었다가 곧바로 다시 닫는다.
 * 3. 이 타이밍에 `MainNav`가 재마운트되며 새로 시도하는 `channel().subscribe()`가 걸리면,
 *    join 요청이 서버의 `phx_reply`를 영원히 못 받고 클라이언트 자체 타임아웃(10초)까지
 *    `TIMED_OUT` 상태로 남는다. `realtime.connect()`를 구독 직전에 강제로 호출해도
 *    자동 재연결 타이머와 경쟁하는 구조 자체는 바뀌지 않아 마찬가지였다.
 *
 * 근본 해결책은 "재마운트 자체가 없게" 만드는 것 — 즉 이 훅을 route group과 무관한 곳에
 * 딱 한 번만 마운트해서, 소켓의 채널 수가 0으로 떨어지는 순간 자체를 없애는 것이다.
 *
 * `(main)/layout.tsx`(Server Component)가 렌더될 때 `getDmUnreadCount()`로 계산한 값을
 * `initialCount`로 받아 시작점으로 쓰되, "정확한 카운트로 재동기화"는 다섯 경로로 이루어진다:
 * 1. **마운트 시점 즉시 1회** `getDmUnreadCountAction()` 호출.
 * 2. `initialCount` prop이 바뀌면(레이아웃이 다시 렌더돼 서버가 새 값을 내려주면) 렌더
 *    도중 state를 그 값으로 조정한다.
 * 3. 읽음 처리/삭제 성공 시 `lib/realtime/dm-badge-bus.ts`를 통해 오는 즉시 신호로 같은
 *    재조회를 바로 호출한다(`router.refresh()` + `revalidatePath`만으로는 반영 타이밍이
 *    보장되지 않았다).
 * 4. 탭이 다시 포커스될 때 같은 재조회를 한 번 더 한다.
 * 5. 20초 폴링으로 같은 재조회를 반복한다.
 *
 * Realtime INSERT 구독은 "되면 즉시 반영되는 보너스"로 유지하고, 위 안전망들이 실시간
 * 경로가 죽어 있어도 항상 정확한 값으로 수렴하게 한다(§CLAUDE.md "즉시 감지 계열 신호는
 * 신뢰도가 낮다 — 항상 주기적 재검증을 최종 안전망으로 둘 것"과 같은 원칙).
 *
 * Realtime 채널은 기본 anon 권한으로 연결되므로, RLS(`auth.uid() in (sender_id, recipient_id)`)가
 * 적용된 이벤트를 받으려면 구독 전(그리고 토큰이 갱신될 때마다) 로그인 세션의 access token을
 * 명시적으로 전달해야 한다. 세션 토큰 자동 갱신(`TOKEN_REFRESHED`) 시에도 다시 전달한다 —
 * 마운트 시점에 한 번만 호출하면 그 이후 토큰이 갱신됐을 때 Realtime 클라이언트가 낡은
 * 토큰을 계속 써서 RLS 인증이 실패할 수 있다.
 */
export function useDmUnreadBadge(initialCount: number, userId: string | null): number {
  const [count, setCount] = useState(initialCount);
  // 직전 렌더의 initialCount를 기억해두고, 렌더 도중 값이 바뀐 게 감지되면 그 자리에서 바로
  // count를 되돌린다(React 공식 문서의 "prop이 바뀌면 state를 조정하는" 패턴 — useEffect 안에서
  // setState하면 추가 렌더가 한 번 더 발생해 react-hooks/set-state-in-effect에 걸린다).
  const [prevInitialCount, setPrevInitialCount] = useState(initialCount);
  if (initialCount !== prevInitialCount) {
    setPrevInitialCount(initialCount);
    setCount(initialCount);
  }

  // 마운트마다 고유한 채널 suffix — crypto.randomUUID()는 보안 컨텍스트가 아니면(LAN IP로
  // http:// 접속 등) 존재하지 않아 TypeError가 나는 함정이 있어(§lib/utils/temp-id.ts) 항상
  // 동작하는 generateTempId()를 재사용한다. useRef 초기화 콜백은 최초 렌더에서만 실행된다.
  const channelSuffixRef = useRef<string | undefined>(undefined);
  if (channelSuffixRef.current === undefined) {
    channelSuffixRef.current = generateTempId();
  }

  const resync = useCallback(async () => {
    const result = await getDmUnreadCountAction();
    if (result.success && typeof result.data === "number") {
      setCount(result.data);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    // 마운트될 때마다 즉시 1회 재동기화 — realtime 경로가 어떤 이유로든 죽어 있어도 페이지
    // 진입 시점에는 항상 정확한 값을 보장하는 안전망이다. resync() 내부의 setState는 서버
    // 액션 응답을 기다린 뒤(비동기 콜백) 실행되므로 실제로는 렌더 도중 동기 setState가
    // 아니지만, 정적 분석 규칙은 이를 구분하지 못한다(§components/search/user-search-panel.tsx
    // 의 기존 동일 처리 참고).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void resync();

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let unmountedBeforeReady = false;

    // await가 끝나기 전에 언마운트되어도 채널 생성·구독 자체는 항상 끝까지 실행한다(그래야
    // 다음 마운트를 기다리지 않고 그 즉시 정리할 수 있다). 이미 cleanup이 실행된 뒤라면
    // (unmountedBeforeReady) 방금 만든 채널을 곧바로 제거해 리크를 막는다.
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      const newChannel = supabase
        .channel(`dm-badge-${userId}-${channelSuffixRef.current}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "dm_notes",
            filter: `recipient_id=eq.${userId}`,
          },
          () => {
            setCount((prev) => prev + 1);
          }
        )
        .subscribe();

      if (unmountedBeforeReady) {
        supabase.removeChannel(newChannel);
      } else {
        channel = newChannel;
      }
    })();

    // 토큰 자동 갱신 시 Realtime 클라이언트에도 새 토큰을 다시 전달한다(위 주석 참고) —
    // 이걸 안 하면 세션이 오래 유지될수록(토큰 만료 주기마다) 구독이 조용히 무력화된다.
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" && session) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    // 읽음 처리/삭제가 성공하면 오는 즉시 신호 — 안전망 중 가장 빠른 경로다(위 3번).
    const unsubscribeBus = subscribeDmBadgeResync(() => void resync());

    // 탭이 다시 포커스되면 실제 값으로 재동기화한다 — Realtime 구독 하나만 믿지 않는 안전망.
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void resync();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const resyncTimer = setInterval(() => void resync(), RESYNC_INTERVAL_MS);

    return () => {
      unmountedBeforeReady = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(resyncTimer);
      unsubscribeBus();
      authSubscription.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, resync]);

  return count;
}
