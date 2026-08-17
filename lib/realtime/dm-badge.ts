"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDmUnreadCountAction } from "@/app/actions/dm";

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
 * "정확한 카운트로 재동기화"는 세 경로로 이루어진다:
 * 1. 읽음 처리/삭제(`markDmNoteReadAction`, `hideDmNoteAction`)가 `revalidatePath("/", "layout")`을
 *    호출하면 다음 네비게이션에서 레이아웃이 새 `initialCount`를 서버에서 다시 계산해 내려주고,
 *    이 훅이 그 값으로 로컬 state를 되돌린다.
 * 2. **탭 재포커스 시점**에 `getDmUnreadCountAction()`으로 실제 값을 다시 조회한다.
 * 3. **60초 폴링**으로 같은 재조회를 반복한다.
 *
 * 2번·3번을 추가한 이유(§실사용 확인 2026-08-17, "배지가 될 때도 있고 안 될 때도 있다"): 이
 * 프로젝트에서 이미 여러 번 겪은 교훈과 같다(§CLAUDE.md) — Realtime 구독처럼 "즉시 감지"
 * 계열 신호 하나만 믿으면 세션 토큰 만료/네트워크 재연결 등으로 조용히 끊긴 뒤에도 알아챌
 * 방법이 없다. 특히 `supabase.realtime.setAuth()`를 마운트 시점에 한 번만 호출하면, 그
 * 이후 토큰이 갱신돼도(자동 리프레시) Realtime 클라이언트는 낡은 토큰을 계속 쓰게 되어
 * RLS 인증이 실패하고 이벤트를 조용히 못 받게 된다 — `onAuthStateChange`의
 * `TOKEN_REFRESHED` 이벤트로 매번 다시 전달해 이 경로도 함께 보강했다.
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
        .channel(`dm-badge-${userId}`)
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
      authSubscription.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, resync]);

  return count;
}
