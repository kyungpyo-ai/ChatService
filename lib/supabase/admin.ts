/**
 * 서비스 롤 키 기반 관리자 Supabase 클라이언트 (Phase 6 cron에서 처음 등장, Phase 7에서 공용화)
 *
 * RLS를 완전히 우회하는 서버 전용 클라이언트다. 세션 저장/갱신이 필요 없는 배치·관리 작업
 * (정리 배치, 계정 탈퇴의 auth.admin.deleteUser 등)에서만 사용하고, 절대 클라이언트로
 * 값을 전달하지 않는다. SUPABASE_SERVICE_ROLE_KEY는 NEXT_PUBLIC_ 접두사를 쓰지 않는
 * 서버 전용 비밀값이다.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY(또는 NEXT_PUBLIC_SUPABASE_URL)가 설정되지 않았습니다."
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
