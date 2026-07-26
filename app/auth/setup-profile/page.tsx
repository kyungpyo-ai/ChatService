/**
 * 닉네임 설정 페이지 (Server Component)
 *
 * OAuth 로그인 후 닉네임을 설정하지 않은 사용자를 위한 페이지입니다.
 * OAuth 메타데이터에서 full_name을 추출하여 닉네임을 자동 생성합니다.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SetupProfileForm } from "@/components/setup-profile-form";
import { generateUsername } from "@/lib/utils/username";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 닉네임 설정 페이지
 *
 * @param searchParams - URL 쿼리 파라미터 (next: 완료 후 이동할 경로)
 */
export default async function SetupProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/" } = await searchParams;

  // 1. 인증 확인
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // 2. 이미 닉네임이 있는지 확인
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  // 닉네임이 이미 있으면 next 경로로 리다이렉트
  if (profile?.username) {
    redirect(next);
  }

  // 3. OAuth 메타데이터에서 full_name 추출하여 닉네임 제안
  const fullName = user.user_metadata?.full_name || "사용자";
  const suggestedUsername = generateUsername(fullName);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>프로필 설정</CardTitle>
          <p className="text-muted-foreground text-sm">닉네임을 설정하여 프로필을 완성해주세요</p>
        </CardHeader>
        <CardContent>
          <SetupProfileForm suggestedUsername={suggestedUsername} redirectPath={next} />
        </CardContent>
      </Card>
    </div>
  );
}
