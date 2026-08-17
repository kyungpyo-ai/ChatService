"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * 쪽지함 안읽음 배지 실시간 갱신 (§ROADMAP Phase 11 후속 개선)
 *
 * `(main)/layout.tsx`(Server Component)가 렌더될 때 `getDmUnreadCount()`로 계산한 초기값을
 * 그대로 시작점으로 쓰되, 탭이 열려있는 동안 새 쪽지가 도착하면(내가 recipient인 INSERT)
 * 별도 페이지 이동/새로고침 없이 즉시 +1 한다. 방채팅/랜덤채팅의 메시지 구독
 * (`lib/realtime/messages.ts`, `lib/realtime/random.ts`)과 동일한 postgres_changes INSERT
 * 패턴을 재사용한다.
 *
 * "정확한 카운트로 재동기화"는 이 훅이 직접 하지 않는다 — 읽음 처리/삭제(`markDmNoteReadAction`,
 * `hideDmNoteAction`)는 각각 `revalidatePath("/", "layout")`을 호출해 다음 네비게이션에서
 * 레이아웃이 새 `initialCount`를 서버에서 다시 계산해 내려주고, 아래 effect가 그 값으로
 * 로컬 state를 리셋한다. 즉 "받으면 즉시 +1(실시간)" / "읽거나 지우면 네비게이션 시점에 정확한
 * 값으로 재동기화(기존 흐름)"로 역할을 나눈다 — 방채팅 수준의 즉시성이 필요 없다는 요구사항에
 * 맞춘 최소 구현이다.
 *
 * Realtime 채널은 기본 anon 권한으로 연결되므로, RLS(`auth.uid() in (sender_id, recipient_id)`)가
 * 적용된 이벤트를 받으려면 구독 전 로그인 세션의 access token을 명시적으로 전달해야 한다.
 */
export function useDmUnreadBadge(initialCount: number, userId: string | null): number {
  const [count, setCount] = useState(initialCount);
  // 직전 렌더의 initialCount를 기억해두고, 렌더 도중 값이 바뀐 게 감지되면 그 자리에서 바로
  // count를 되돌린다(React 공식 문서의 "prop이 바뀌면 state를 조정하는" 패턴 — useEffect 안에서
  // setState하면 추가 렌더가 한 번 더 발생해 react-hooks/set-state-in-effect에 걸린다).
  // 페이지 이동/새로고침으로 레이아웃이 재검증돼 서버가 정확한 값을 다시 내려준 경우, 실시간으로
  // 늘어난 카운트와 읽음 처리로 줄어든 진짜 값이 어긋나지 않도록 한다.
  const [prevInitialCount, setPrevInitialCount] = useState(initialCount);
  if (initialCount !== prevInitialCount) {
    setPrevInitialCount(initialCount);
    setCount(initialCount);
  }

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

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return count;
}
