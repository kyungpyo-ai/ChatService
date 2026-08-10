/**
 * 온라인 상태(하트비트) 관련 Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * 로그인 사용자의 마지막 활동 시각(`last_seen_at`)을 현재 시각으로 갱신한다.
 *
 * `lib/hooks/use-heartbeat.ts`에서 주기적으로 호출되며, 검색 결과의 온라인 여부(2분 임계값,
 * `lib/queries/users.ts`)와 게스트 계정 자동 정리(`cleanup_stale_anonymous_users()`)의
 * 근거 데이터가 된다. 게스트(익명 로그인)는 `profiles`가 아니라 `guest_profiles`에 저장되므로
 * JWT의 `is_anonymous` 클레임으로 갱신 대상 테이블을 분기한다.
 *
 * `sendRoomMessageAction`과 동일하게 네트워크 왕복이 없는 `getClaims()`로 로그인 여부만
 * 확인한다. 비로그인 상태면 에러가 아니라 조용히 아무 것도 하지 않고 반환한다.
 */
export async function updateLastSeenAction(): Promise<void> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const claims = data?.claims;
    const userId = claims?.sub;

    if (authError || !userId) {
      return;
    }

    const isAnonymous = claims?.is_anonymous === true;
    const table = isAnonymous ? "guest_profiles" : "profiles";

    // RLS는 기존 "본인 행 수정"(auth.uid() = id) 정책을 그대로 재사용한다.
    // record_daily_activity()는 daily_active_users에 "오늘 활동했다"는 사실을 1행만 남기는
    // SECURITY DEFINER RPC — last_seen_at처럼 매번 덮어쓰지 않아 과거 날짜별 DAU를 보존한다.
    await Promise.all([
      supabase.from(table).update({ last_seen_at: new Date().toISOString() }).eq("id", userId),
      supabase.rpc("record_daily_activity"),
    ]);
  } catch {
    // 하트비트 실패는 사용자에게 노출할 필요가 없는 백그라운드 동작이므로 조용히 무시한다.
  }
}

/**
 * 방채팅 화면을 열어두고 있는 회원의 방 접속 하트비트(`profiles.room_heartbeat_room_id`/
 * `room_heartbeat_at`)를 갱신한다.
 *
 * `lib/hooks/use-room-heartbeat.ts`에서 방채팅 화면(`RoomChatView`)이 마운트되어 있는 동안
 * 주기적으로 호출된다 — 관리자 대시보드가 "방채팅 실시간 접속자"를 집계할 근거 데이터가 된다
 * (§20260813000000). 방채팅은 게스트가 참여할 수 없으므로(§20260804145642) profiles만
 * 대상이며, 실제 그 방의 멤버인지는 DB 함수(`heartbeat_room_presence`)가 재검증한다.
 *
 * 언마운트 시 명시적으로 지우지 않는다 — 네트워크 순단/탭 강제종료 시 언마운트 이벤트가 안
 * 터지는 문제를 랜덤채팅 쪽에서 이미 겪었고(§20260805010000), 신선도 윈도우(2분)로 자연
 * 만료시키는 방식을 그대로 따른다.
 */
export async function updateRoomHeartbeatAction(roomId: string): Promise<void> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return;
    }

    await supabase.rpc("heartbeat_room_presence", { p_room_id: roomId });
  } catch {
    // 하트비트 실패는 사용자에게 노출할 필요가 없는 백그라운드 동작이므로 조용히 무시한다.
  }
}
