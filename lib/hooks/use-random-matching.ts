"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { enterRandomQueueAction, cancelRandomQueueAction } from "@/app/actions/random";

// postgres_changes INSERT 구독이 매칭 감지의 빠른 경로지만, 실제 네트워크 환경에서는 Realtime
// 전송 자체가 항상 즉시 도착한다고 보장할 수 없다(§DEVELOPMENT_PLAN 5.5, 라이브 테스트로 확인).
// 특히 "이미 대기열에 있다가 상대에게 선택된 쪽"은 자기 RPC 응답으로는 알 수 없고 오직 이 실시간
// 알림에만 의존하므로, 알림을 놓치면 다음 폴링까지 그대로 대기하게 된다. 폴링 간격이 곧 최악의
// 경우 대기 시간이므로 짧게 유지한다.
const FALLBACK_POLL_INTERVAL_MS = 5000;

interface UseRandomMatchingResult {
  sessionId: string | null;
  error: string | null;
}

/**
 * 매칭 대기 화면 전용 클라이언트 훅 (§DEVELOPMENT_PLAN 5.5)
 *
 * 1. 세션이 없으면 익명 로그인(signInAnonymously)을 클라이언트에서 발급한다 — 브라우저 쿠키에
 *    세션을 기록해야 하므로 반드시 클라이언트에서 실행해야 한다(§ARCHITECTURE 2.2).
 * 2. 곧바로 서버 액션 enterRandomQueueAction()을 호출해 match_or_wait()를 실행한다. 유령 대기자
 *    필터링은 Realtime Presence가 아니라 DB의 하트비트 신선도로 판단한다 — 대기실 Presence는
 *    실제 네트워크 환경에서 동기화가 불안정한 것을 라이브 테스트로 확인해 제거했다(§5.5).
 * 3. 매칭이 바로 성사되면 sessionId를 즉시 반환한다.
 * 4. 대기 상태면 random_sessions INSERT를 본인 user_id 필터로 구독하고(채널당 단일 바인딩
 *    제약 때문에 user_a_id/user_b_id 필터 채널 2개로 분리), 5초 간격 폴백 폴링을 병행한다.
 *    match_or_wait()는 멱등하므로 재호출해도 안전하다.
 * 5. 매칭 완료가 아닌 상태로 언마운트되면 대기열 정리를 베스트에포트로 시도한다(RND-05).
 */
export function useRandomMatching(): UseRandomMatchingResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const matchedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let channels: ReturnType<typeof supabase.channel>[] = [];

    const stopPolling = () => {
      if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const handleMatched = async (matchedSessionId: string) => {
      if (cancelled) return;
      matchedRef.current = true;
      stopPolling();

      // postgres_changes 채널의 unsubscribe가 끝나기 전에 세션 화면으로 넘어가면, 같은 Realtime
      // 연결(createBrowserClient가 내부적으로 재사용) 위에서 새로 구독하는 세션 채널과 경쟁해
      // 새 구독의 이벤트가 조용히 안 오는 경우가 있었다(Playwright로 재현 확인). remove가 끝난
      // 뒤에 sessionId를 반영해 화면 전환이 일어나게 한다.
      const removals = channels.map((channel) => supabase.removeChannel(channel));
      channels = [];
      await Promise.all(removals);

      if (cancelled) return;
      setSessionId(matchedSessionId);
    };

    const handleSessionExpired = async (message: string) => {
      stopPolling();
      setError(message);
      await supabase.auth.signOut();
      window.setTimeout(() => window.location.reload(), 1500);
    };

    const attemptMatch = async () => {
      const result = await enterRandomQueueAction();
      if (cancelled) return;
      if (!result.success) {
        if (result.sessionExpired) {
          void handleSessionExpired(result.message);
          return;
        }
        setError(result.message);
        return;
      }
      if (result.sessionId) {
        void handleMatched(result.sessionId);
      }
    };

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let uid = session?.user.id ?? null;

      if (!uid) {
        const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();
        if (cancelled) return;
        if (signInError || !signInData.session) {
          setError("게스트 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
          return;
        }
        uid = signInData.session.user.id;
        supabase.realtime.setAuth(signInData.session.access_token);
      } else {
        supabase.realtime.setAuth(session!.access_token);
      }

      if (cancelled || !uid) return;

      const result = await enterRandomQueueAction();
      if (cancelled) return;

      if (!result.success) {
        if (result.sessionExpired) {
          void handleSessionExpired(result.message);
          return;
        }
        setError(result.message);
        return;
      }

      if (result.sessionId) {
        void handleMatched(result.sessionId);
        return;
      }

      // 대기 상태 — 매칭 성사(random_sessions INSERT)를 실시간으로 감지
      const channelA = supabase
        .channel(`random-match-${uid}-a`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "random_sessions",
            filter: `user_a_id=eq.${uid}`,
          },
          (payload) => void handleMatched((payload.new as { id: string }).id)
        )
        .subscribe();

      const channelB = supabase
        .channel(`random-match-${uid}-b`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "random_sessions",
            filter: `user_b_id=eq.${uid}`,
          },
          (payload) => void handleMatched((payload.new as { id: string }).id)
        )
        .subscribe();

      channels = [channelA, channelB];

      // 폴백 폴링 — match_or_wait()는 멱등하므로 재호출해도 안전하다(§5.5)
      pollTimer = setInterval(() => void attemptMatch(), FALLBACK_POLL_INTERVAL_MS);
    })();

    return () => {
      cancelled = true;
      stopPolling();
      channels.forEach((channel) => supabase.removeChannel(channel));
      if (!matchedRef.current) {
        void cancelRandomQueueAction();
      }
    };
  }, []);

  return { sessionId, error };
}
