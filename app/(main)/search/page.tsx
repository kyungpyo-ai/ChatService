import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserSearchPanel } from "@/components/search/user-search-panel";

/**
 * 사용자 검색 페이지.
 * 비로그인 리다이렉트 자체는 미들웨어가 `/search`를 이미 보호 경로로 처리하므로
 * (`lib/supabase/middleware.ts`의 `isPublicPath`에 `/search`가 없음) 여기서는
 * `UserSearchPanel`에 넘길 현재 사용자 id만 조회한다.
 */
export default async function UserSearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <UserSearchPanel currentUserId={user.id} />;
}
