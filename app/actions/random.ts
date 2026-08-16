/**
 * 랜덤채팅 매칭 관련 Server Actions
 *
 * 매칭 진입/취소/종료를 처리한다. 익명 로그인(signInAnonymously)은 브라우저 쿠키에 세션을
 * 기록해야 하므로 반드시 클라이언트에서 실행하고(§ARCHITECTURE 2.2), 그 직후 매칭 요청은
 * 여기(서버 액션)에서 새로 동기화된 쿠키로 처리한다(§DEVELOPMENT_PLAN 5.1).
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { isStaleSessionError } from "@/lib/utils/stale-session";
import type { ActionResult } from "@/lib/types/forms";

const SESSION_EXPIRED_MESSAGE =
  "로그인 세션이 만료되어 자동으로 로그아웃했어요. 새로고침 후 다시 시도해주세요.";

interface EnterQueueResult {
  success: boolean;
  message: string;
  sessionId: string | null;
  sessionExpired?: boolean;
}

/**
 * 매칭 대기열 진입 — match_or_wait() DB 함수(SECURITY DEFINER)가 대기열 조회/등록/세션 생성을
 * 단일 트랜잭션으로 원자적으로 처리한다(RND-01~03). 이미 대기 중이거나 이미 활성 세션이 있어도
 * 안전하게 재호출할 수 있는 멱등 함수라, 대기 화면의 5초 폴백 폴링에서도 그대로 재사용한다(§5.5).
 * 폼이 아닌 클릭/이펙트에서 직접 호출되므로 redirect 없이 값만 반환한다(leaveRoomAction과 동일 패턴).
 *
 * 매칭 후보 필터링은 Realtime Presence가 아니라 DB의 하트비트 신선도(15초)로 판단한다(§5.5) —
 * 실제 네트워크 환경에서 Presence 동기화 자체가 불안정한 것을 라이브 테스트로 확인해 제거했다.
 */
export async function enterRandomQueueAction(): Promise<EnterQueueResult> {
  try {
    const supabase = await createClient();

    // 익명 세션 포함, 로그인 여부만 확인하면 되므로 네트워크 왕복 없는 getClaims()로 충분하다.
    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다.", sessionId: null };
    }

    const { data: sessionId, error: rpcError } = await supabase.rpc("match_or_wait");

    if (rpcError) {
      if (isStaleSessionError(rpcError)) {
        await supabase.auth.signOut();
        return {
          success: false,
          message: SESSION_EXPIRED_MESSAGE,
          sessionId: null,
          sessionExpired: true,
        };
      }
      return { success: false, message: "매칭 대기열 진입에 실패했습니다.", sessionId: null };
    }

    return { success: true, message: "", sessionId: sessionId ?? null };
  } catch {
    return { success: false, message: "매칭 중 오류가 발생했습니다.", sessionId: null };
  }
}

/**
 * 매칭 취소 — cancel_random_queue() 호출로 본인의 random_queue 행만 삭제한다(RND-05).
 * 대기열에 없는 상태에서 호출해도 조용히 무시되므로(삭제 대상 0건) 여러 번 호출해도 안전하다.
 */
export async function cancelRandomQueueAction(): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error: rpcError } = await supabase.rpc("cancel_random_queue");

    if (rpcError) {
      return { success: false, message: "매칭 취소에 실패했습니다." };
    }

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "매칭 취소 중 오류가 발생했습니다." };
  }
}

export interface HeartbeatSessionResult {
  status: "active" | "ended" | null;
  endedBy: string | null;
  partnerStale: boolean;
}

/**
 * 활성 세션 하트비트 — heartbeat_random_session() 호출로 본인의 last_seen 컬럼을 갱신하고,
 * 같은 왕복에서 세션 status와 "상대가 지정한 초 이상 조용한가"(partner_stale)를 함께 받는다
 * (§DEVELOPMENT_PLAN 5.5). 이 판단은 클라이언트 시계가 아니라 DB 서버 시각 기준으로 서버에서
 * 끝내서 반환한다 — 예전에는 상대의 마지막 활동 시각(timestamptz)을 그대로 내려받아 클라이언트의
 * Date.now()와 비교했는데, 매칭 직후 즉시 "상대가 종료함"으로 오판하는 버그가 실사용 중
 * 확인됐다(§2026-08-16, Supabase 로그로 end_random_session 호출 주체를 추적해 원인 특정).
 *
 * 검색 화면 온라인 표시용 하트비트(app/actions/heartbeat.ts)와는 별개다 — 그쪽은 탭이
 * 백그라운드면 갱신을 멈추지만, 이건 "채팅방을 열어두고 있는지"만 봐야 하므로 탭 가시성과
 * 무관하게 계속 호출돼야 한다(호출 주기는 클라이언트 훅이 관리).
 *
 * 세션이 없거나(row 자체가 아카이브돼 삭제됨) 본인이 참여자가 아니면 status가 null로 온다 —
 * 두 경우 모두 클라이언트에서는 "더 이상 유효하지 않음"으로 동일하게 처리하면 된다.
 *
 * `staleSeconds`(기본 12초)는 "상대가 몇 초 넘게 조용해야 나간 것으로 볼지"의 기준을 호출
 * 시점에 선택할 수 있게 한다 — 정기 5초 폴링에서는 기본값(12초)을 그대로 쓰고, Presence
 * `leave` 신호를 받은 뒤 재검증할 때만 더 짧은 값을 넘겨 빠르게 확정한다(§lib/realtime/random.ts).
 */
export async function heartbeatRandomSessionAction(
  sessionId: string,
  staleSeconds = 12
): Promise<HeartbeatSessionResult> {
  try {
    const supabase = await createClient();

    const { data, error } = (await supabase
      .rpc("heartbeat_random_session", { p_session_id: sessionId, p_stale_seconds: staleSeconds })
      .maybeSingle()) as {
      data: { status: string; ended_by: string | null; partner_stale: boolean } | null;
      error: unknown;
    };

    if (error || !data) {
      return { status: null, endedBy: null, partnerStale: false };
    }

    return {
      status: data.status as "active" | "ended" | null,
      endedBy: data.ended_by,
      partnerStale: data.partner_stale,
    };
  } catch {
    return { status: null, endedBy: null, partnerStale: false };
  }
}

/**
 * 랜덤채팅 세션 종료 — end_random_session() 호출로 상태를 'ended'로 변경한다(RND-05).
 * 이미 종료된 세션에 대한 중복 호출은 DB 함수 내부의 `where status = 'active'` 조건으로
 * 조용히 무시되므로, 재매칭 흐름에서 "혹시 몰라 종료 호출"을 해도 안전하다.
 */
export async function endRandomSessionAction(sessionId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { error: rpcError } = await supabase.rpc("end_random_session", {
      p_session_id: sessionId,
    });

    if (rpcError) {
      return { success: false, message: "대화 종료에 실패했습니다." };
    }

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "대화 종료 중 오류가 발생했습니다." };
  }
}
