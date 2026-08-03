/**
 * 사용자 검색 관련 Server Actions
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { searchUsers, type SearchUserResult } from "@/lib/queries/users";

const MIN_QUERY_LENGTH = 2;

/**
 * 닉네임으로 사용자 검색 (SEARCH-01~03)
 *
 * 비로그인 사용자는 빈 배열을 반환한다(SEARCH-01. 미들웨어가 `/search` 자체를 이미
 * 보호 경로로 처리하지만, 서버 액션 단에서도 한 번 더 확인한다).
 * 검색어가 2자 미만이면 과도한 broad-match를 막기 위해 빈 배열을 반환한다.
 */
export async function searchUsersAction(query: string): Promise<SearchUserResult[]> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return [];
    }

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return [];
    }

    return await searchUsers(trimmed, userId);
  } catch {
    return [];
  }
}
