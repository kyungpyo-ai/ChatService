"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDmUnreadCountAction } from "@/app/actions/dm";
import { subscribeDmBadgeResync } from "@/lib/realtime/dm-badge-bus";
import { generateTempId } from "@/lib/utils/temp-id";

// 배지 하나 세는 용도라 방채팅 하트비트(5~10초)처럼 자주 돌 필요는 없다 — 안전망이므로
// 60초면 충분하다(§실사용 확인 2026-08-17, "될 때도 있고 안 될 때도 있다"는 증상의 안전망).
const RESYNC_INTERVAL_MS = 60_000;

/**
 * 쪽지함 안읽음 배지 실시간 갱신 (§ROADMAP Phase 11 후속 개선)
 *
 * `(main)/layout.tsx`(Server Component)가 렌더될 때 `getDmUnreadCount()`로 계산한 초기값을
 * 그대로 시작점으로 쓰되, 탭이 열려있는 동안 새 쪽지가 도착하면(내가 recipient인 INSERT)
 * 별도 페이지 이동/새로고침 없이 즉시 +1 한다. 방채팅/랜덤채팅의 메시지 구독
 * (`lib/realtime/messages.ts`, `lib/realtime/random.ts`)과 동일한 postgres_changes INSERT
 * 패턴을 재사용한다.
 *
 * "정확한 카운트로 재동기화"는 네 경로로 이루어진다:
 * 1. 페이지 이동/새로고침으로 레이아웃이 다시 렌더되면 서버가 계산한 새 `initialCount`를
 *    받아, 렌더 도중 state를 조정하는 패턴으로 로컬 state를 되돌린다.
 * 2. 읽음 처리/삭제 성공 시 `lib/realtime/dm-badge-bus.ts`를 통해 오는 즉시 신호로
 *    `getDmUnreadCountAction()`을 바로 호출한다(§실사용 확인 2026-08-18 — `router.refresh()`
 *    + `revalidatePath`만으로는 반영 타이밍이 보장되지 않았다).
 * 3. 탭이 다시 포커스될 때 같은 재조회를 한 번 더 한다.
 * 4. 60초 폴링으로 같은 재조회를 반복한다.
 *
 * 2~4번을 추가한 이유(§실사용 확인 2026-08-17, "배지가 될 때도 있고 안 될 때도 있다"): 이
 * 프로젝트에서 이미 여러 번 겪은 교훈과 같다(§CLAUDE.md) — Realtime 구독처럼 "즉시 감지"
 * 계열 신호 하나만 믿으면 세션 토큰 만료/네트워크 재연결 등으로 조용히 끊긴 뒤에도 알아챌
 * 방법이 없다. 특히 `supabase.realtime.setAuth()`를 마운트 시점에 한 번만 호출하면, 그
 * 이후 토큰이 갱신돼도(자동 리프레시) Realtime 클라이언트는 낡은 토큰을 계속 쓰게 되어
 * RLS 인증이 실패하고 이벤트를 조용히 못 받게 된다 — `onAuthStateChange`의
 * `TOKEN_REFRESHED` 이벤트로 매번 다시 전달해 이 경로도 함께 보강했다.
 *
 * **채널 이름을 마운트마다 고유하게 만드는 이유**(§실사용 확인 2026-08-18, 핵심 단서 —
 * "/random(다른 route group)에 한 번 들어갔다 나오면 그 이후로는 배지 실시간 갱신이 안 됨"):
 * `/random`은 `(chat)` route group, 이 훅을 쓰는 `MainNav`는 `(main)` route group 소속이라
 * 그 사이를 오가면 최상위 레이아웃이 통째로 바뀌면서 이 훅이 매번 언마운트→재마운트된다.
 * `createClient()`(`@supabase/ssr`의 `createBrowserClient()`)는 같은 탭 안에서 Realtime
 * 소켓 연결을 사실상 싱글턴처럼 재사용하는데, 채널 이름이 고정(`dm-badge-${userId}`)이면
 * 언마운트 시 정리 중인(`removeChannel()`은 fire-and-forget이라 서버 반영을 기다리지 않는다)
 * 옛 채널과 재마운트로 새로 `subscribe()`하는 채널의 이름이 겹쳐, 새 구독이 서버에 조용히
 * 무시될 수 있다 — `lib/hooks/use-random-matching.ts`가 세션 채널 전환 시 이미 겪고 고친
 * 것과 같은 클래스의 경쟁 상태다. 마운트 시점에 한 번 생성한 고유 suffix를 이름에 붙여
 * 이전 채널과 절대 겹치지 않게 한다.
 *
 * Realtime 채널은 기본 anon 권한으로 연결되므로, RLS(`auth.uid() in (sender_id, recipient_id)`)가
 * 적용된 이벤트를 받으려면 구독 전(그리고 토큰이 갱신될 때마다) 로그인 세션의 access token을
 * 명시적으로 전달해야 한다.
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

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
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

    // 읽음 처리/삭제가 성공하면 오는 즉시 신호 — 안전망 중 가장 빠른 경로다(위 주석 2번).
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
      cancelled = true;
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
