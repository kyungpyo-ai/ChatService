/**
 * rate limit 체크 공용 헬퍼 — check_and_record_rate_limit() SECURITY DEFINER 함수를 감싼다.
 *
 * 한도는 PRD에 구체적 수치가 없어 임의로 정한 기본값이다(§DEVELOPMENT_PLAN Phase 7.1 (4)).
 * 필요 시 아래 상수만 조정하면 된다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const RATE_LIMITS = {
  send_message: { maxCount: 30, windowSeconds: 10 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

/** 한도 이내면 이번 호출을 기록하고 true, 초과했으면 기록하지 않고 false를 반환한다. */
export async function checkRateLimit(
  supabase: SupabaseClient,
  action: RateLimitAction
): Promise<boolean> {
  const { maxCount, windowSeconds } = RATE_LIMITS[action];

  const { data, error } = await supabase.rpc("check_and_record_rate_limit", {
    p_action: action,
    p_max_count: maxCount,
    p_window_seconds: windowSeconds,
  });

  // 함수 호출 자체가 실패하면(네트워크 등) 사용자를 막지 않는다 — rate limit은 남용 방지용
  // 부가 방어선이지 주 기능이 아니므로, 여기서 에러가 나서 정상 이용을 막는 게 더 나쁘다.
  if (error) {
    return true;
  }

  return data === true;
}
