"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getDmUnreadCountAction } from "@/app/actions/dm";
import { subscribeDmBadgeResync } from "@/lib/realtime/dm-badge-bus";
import { generateTempId } from "@/lib/utils/temp-id";

// 배지 하나 세는 용도라 방채팅 하트비트(5~10초)처럼 자주 돌 필요는 없지만, 아래 "마운트 시점
// 즉시 재동기화" 안전망을 뒷받침하기 위해 60초에서 20초로 좁혔다(§실사용 확인 2026-08-18,
// Playwright로 WebSocket 프레임을 직접 캡처해 확인한 내용 참고).
const RESYNC_INTERVAL_MS = 20_000;

/**
 * 쪽지함 안읽음 배지 실시간 갱신 (§ROADMAP Phase 11 후속 개선)
 *
 * `(main)/layout.tsx`(Server Component)가 렌더될 때 `getDmUnreadCount()`로 계산한 초기값을
 * 그대로 시작점으로 쓰되, 탭이 열려있는 동안 새 쪽지가 도착하면(내가 recipient인 INSERT)
 * 별도 페이지 이동/새로고침 없이 즉시 +1 한다. 방채팅/랜덤채팅의 메시지 구독
 * (`lib/realtime/messages.ts`, `lib/realtime/random.ts`)과 동일한 postgres_changes INSERT
 * 패턴을 재사용한다.
 *
 * "정확한 카운트로 재동기화"는 다섯 경로로 이루어진다:
 * 1. **마운트 시점 즉시 1회** `getDmUnreadCountAction()` 호출(아래 "왜 마운트 시점에 즉시
 *    재동기화하는가" 참고 — 가장 중요한 안전망).
 * 2. 페이지 이동/새로고침으로 레이아웃이 다시 렌더되면 서버가 계산한 새 `initialCount`를
 *    받아, 렌더 도중 state를 조정하는 패턴으로 로컬 state를 되돌린다.
 * 3. 읽음 처리/삭제 성공 시 `lib/realtime/dm-badge-bus.ts`를 통해 오는 즉시 신호로 같은
 *    재조회를 바로 호출한다(§실사용 확인 2026-08-18 — `router.refresh()` + `revalidatePath`만
 *    으로는 반영 타이밍이 보장되지 않았다).
 * 4. 탭이 다시 포커스될 때 같은 재조회를 한 번 더 한다.
 * 5. 20초 폴링으로 같은 재조회를 반복한다.
 *
 * ## 왜 마운트 시점에 즉시 재동기화하는가 (§실사용 확인 2026-08-18, 결정적 재현)
 *
 * "/random(다른 route group)에 한 번 들어갔다 나오면 그 이후로는 배지 실시간 갱신이 안 됨"이라는
 * 제보를 Playwright + 실제 테스트 계정 2개로 재현하며, 브라우저 WebSocket 프레임을 직접
 * 캡처해 원인을 확인했다:
 *
 * - `/random`은 `(chat)` route group, 이 훅을 쓰는 `MainNav`는 `(main)` route group 소속이라
 *   그 사이를 오가면 최상위 레이아웃이 통째로 바뀌면서 `MainNav`가 매번 언마운트→재마운트된다.
 * - `/random`으로 이동하면 이 훅의 cleanup이 정상적으로 실행되어 `dm-badge-*` 채널의
 *   `phx_leave` 프레임이 전송되는 것을 확인했다(=언마운트는 확실히 일어난다).
 * - 하지만 다시 홈으로 돌아왔을 때는 **`dm-badge-*` 채널의 새 `phx_join` 프레임이 전혀
 *   전송되지 않았다** — 채널 이름을 마운트마다 고유하게 만드는 방어(이 파일에 이미 있던 수정)를
 *   적용한 뒤에도 동일하게 재현되어, 최초 가설이었던 "채널 이름 충돌"만으로는 설명되지 않는
 *   더 근본적인 문제였다(정확한 메커니즘은 특정하지 못했다 — Next.js 16 App Router가
 *   route group 경계를 넘나드는 네비게이션에서 클라이언트 컴포넌트를 어떻게 재사용/재마운트
 *   하는지의 세부 동작으로 추정된다).
 * - 반대로 새로고침 없는 "단순 마운트" 상태(같은 (main) 레이아웃 안에서 한 번도 벗어나지
 *   않은 경우)에서는 이 채널이 정상적으로 INSERT 이벤트를 즉시(1초 내) 전달하는 것도 함께
 *   확인했다 — 즉 Realtime 구독 자체나 RLS/publication 설정은 문제가 아니고, 특정 종류의
 *   재마운트 이후에만 재구독이 조용히 실패한다.
 *
 * 정확한 근본 원인을 계속 추적하는 대신, 이 프로젝트가 이미 여러 번 채택한 원칙(§CLAUDE.md
 * "sendBeacon/pagehide/Presence leave 같은 즉시 감지 계열은 신뢰도가 낮다 — 되면 좋은 보너스
 * 경로로만 쓰고, 항상 별도의 주기적 재검증을 최종 안전망으로 둘 것")을 그대로 적용했다:
 * Realtime INSERT 구독은 "되면 즉시 반영되는 보너스"로 유지하되, **마운트될 때마다(=이런
 * 재마운트 시나리오를 포함해) 무조건 한 번 실제 값으로 재동기화**해 realtime 경로가 조용히
 * 죽어 있어도 페이지 진입 시점에는 항상 정확한 값을 보장한다. 폴링 간격도 60초→20초로
 * 좁혀 "탭을 이동하지 않고 같은 화면에 계속 머무는 동안 realtime만 죽는" 나머지 경우의
 * 최대 지연도 줄였다.
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

    // 마운트될 때마다 즉시 1회 재동기화 — 위 문서화된 재현 사례(재마운트 후 Realtime
    // 재구독이 조용히 실패하는 경우)의 핵심 안전망이다. Realtime 경로가 정상이면 이 호출은
    // 중복일 뿐 무해하고(둘 다 같은 참값에 수렴), 실패한 경우에는 이 호출 하나가 유일한
    // 복구 수단이 된다. resync() 내부의 setState는 서버 액션 응답을 기다린 뒤(비동기 콜백)
    // 실행되므로 실제로는 렌더 도중 동기 setState가 아니지만, 정적 분석 규칙은 이를
    // 구분하지 못한다(§components/search/user-search-panel.tsx의 기존 동일 처리 참고).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void resync();

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

    // 읽음 처리/삭제가 성공하면 오는 즉시 신호 — 안전망 중 가장 빠른 경로다(위 주석 3번).
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
