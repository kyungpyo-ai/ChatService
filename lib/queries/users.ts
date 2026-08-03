/**
 * 사용자 검색 관련 데이터베이스 쿼리 함수
 */

import { createClient } from "@/lib/supabase/server";

export interface SearchUserResult {
  id: string;
  nickname: string;
  age: number | null;
  gender: "male" | "female" | null;
  avatarUrl: string | null;
  isOnline: boolean;
}

// ARCHITECTURE.md §5.2 — 하트비트 기준 온라인 판단 임계값 (2분)
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * 닉네임 부분 검색 — 게스트(익명) 계정 제외, 본인 제외, 최대 30건.
 *
 * `username ilike '%query%'`는 `profiles_username_trgm_idx`(gin, gin_trgm_ops) 덕분에
 * 순차 스캔 없이 인덱스를 탄다. 로그인 여부 재검증은 호출자인 `searchUsersAction`이
 * 담당하고, 이 함수 자체는 인증 여부를 모르는 얇은 데이터 계층으로 유지한다
 * (`getRoomList`류 기존 패턴과 일관).
 */
export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<SearchUserResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, age, gender, avatar_url, last_seen_at")
    .eq("is_anonymous", false)
    .neq("id", currentUserId)
    .ilike("username", `%${query}%`)
    .limit(30);

  if (error || !data) return [];

  const now = Date.now();

  return data
    .filter((row) => row.username !== null)
    .map((row) => ({
      id: row.id,
      nickname: row.username!,
      age: row.age,
      gender: row.gender as "male" | "female" | null,
      avatarUrl: row.avatar_url,
      isOnline: now - new Date(row.last_seen_at).getTime() < ONLINE_THRESHOLD_MS,
    }));
}
