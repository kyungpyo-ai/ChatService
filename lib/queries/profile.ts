/**
 * 프로필 관련 데이터베이스 쿼리 함수
 *
 * Server Components에서 사용하는 Supabase 쿼리 모음입니다.
 */

import { createClient } from "@/lib/supabase/server";
import type { User } from "@/lib/types/models";

/**
 * 사용자 프로필 조회
 *
 * profiles 테이블에서 사용자 ID로 프로필 정보를 조회합니다.
 *
 * @param userId - 사용자 ID
 * @returns Promise<User | null> - 사용자 프로필 또는 null
 *
 * @example
 * ```typescript
 * const profile = await getUserProfile(user.id);
 * if (profile) {
 *   console.log(profile.username);
 * }
 * ```
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * 닉네임 사용 가능 여부 확인
 *
 * profiles 테이블에서 닉네임 중복을 확인합니다.
 * 현재 사용자 ID를 제공하면 본인의 닉네임은 사용 가능으로 표시됩니다.
 *
 * @param username - 확인할 닉네임
 * @param currentUserId - 현재 사용자 ID (본인 제외용, 선택)
 * @returns Promise<boolean> - 사용 가능 여부 (true: 사용 가능, false: 이미 사용 중)
 *
 * @example
 * ```typescript
 * // 새 닉네임 확인
 * const available = await checkUsernameAvailability("새닉네임");
 *
 * // 본인 닉네임 수정 시 (본인 닉네임은 제외)
 * const available = await checkUsernameAvailability("새닉네임", user.id);
 * ```
 */
export async function checkUsernameAvailability(
  username: string,
  currentUserId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();

    const query = supabase.from("profiles").select("id").eq("username", username);

    // 현재 사용자는 제외 (본인의 닉네임은 사용 가능으로 표시)
    if (currentUserId) {
      query.neq("id", currentUserId);
    }

    const { data, error } = await query.single();

    // PGRST116: 결과 없음 (사용 가능)
    if (error && error.code === "PGRST116") {
      return true;
    }

    if (error) {
      return false;
    }

    // 데이터가 있으면 이미 사용 중
    return !data;
  } catch {
    return false;
  }
}
