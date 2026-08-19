/**
 * 닉네임 설정 페이지 (Server Component)
 *
 * OAuth 로그인 후 닉네임을 설정하지 않은 사용자를 위한 페이지입니다.
 * OAuth 메타데이터에서 full_name을 추출하여 닉네임을 자동 생성합니다.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { SetupProfileForm } from "@/components/setup-profile-form";
import { generateUsername } from "@/lib/utils/username";
import { Button } from "@/components/ui/button";

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
      <div className="bg-surface w-full max-w-md rounded-(--radius-card) border p-6 shadow-(--shadow-card)">
        <div className="mb-6 space-y-1">
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            프로필 설정
          </h1>
          <p className="text-muted-foreground text-sm">닉네임을 설정하여 프로필을 완성해주세요</p>
        </div>
        <SetupProfileForm suggestedUsername={suggestedUsername} redirectPath={next} />
        {/* 다른 계정으로 가입하고 싶거나 이 단계를 완료하지 않고 나가고 싶을 때의
            탈출구 — 없으면 닉네임을 설정하기 전까진 로그인할 때마다 이 화면으로만
            되돌아와 로그아웃할 방법이 없는 막다른 골목이 된다(§사용자 재현 확인). */}
        <form action={signOut} className="mt-4 text-center">
          <Button type="submit" variant="link" className="text-muted-foreground h-auto p-0">
            다른 계정으로 로그인하기 (로그아웃)
          </Button>
        </form>
      </div>
    </div>
  );
}
