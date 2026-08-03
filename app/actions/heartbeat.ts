/**
 * 온라인 상태(하트비트) 관련 Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * 로그인 사용자의 마지막 활동 시각(`profiles.last_seen_at`)을 현재 시각으로 갱신한다.
 *
 * `lib/hooks/use-heartbeat.ts`에서 주기적으로 호출되며, 검색 결과의 온라인 여부(2분 임계값,
 * `lib/queries/users.ts`)를 판단하는 근거 데이터가 된다.
 *
 * `sendRoomMessageAction`과 동일하게 네트워크 왕복이 없는 `getClaims()`로 로그인 여부만
 * 확인한다. 비로그인 상태면 에러가 아니라 조용히 아무 것도 하지 않고 반환한다.
 */
export async function updateLastSeenAction(): Promise<void> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return;
    }

    // RLS는 기존 "본인 프로필 수정"(auth.uid() = id) 정책을 그대로 재사용한다.
    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", userId);
  } catch {
    // 하트비트 실패는 사용자에게 노출할 필요가 없는 백그라운드 동작이므로 조용히 무시한다.
  }
}
