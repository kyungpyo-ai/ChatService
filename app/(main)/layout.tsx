import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { HeartbeatProvider } from "@/components/layout/heartbeat-provider";

/**
 * (main) route group 공용 레이아웃 — AppHeader(모바일) + BottomNav(모바일) / SidebarNav(PC)
 *
 * 가입 경로(이메일/OAuth)와 무관하게, 로그인했지만 닉네임(=프로필) 설정이 끝나지 않은
 * 사용자는 여기서 setup-profile로 보낸다(§DEVELOPMENT_PLAN 7.7.1) — 기존에는 OAuth 콜백
 * 라우트에만 이 가드가 있어 이메일 가입자는 나이/약관 동의 없이 서비스를 계속 쓸 수 있었다.
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(user.id) : null;

  if (user && profile && !profile.username) {
    redirect("/auth/setup-profile");
  }

  const isLoggedIn = Boolean(user);

  return (
    <div className="bg-surface-muted min-h-screen">
      <HeartbeatProvider userId={user?.id ?? null} />
      <AppHeader
        isLoggedIn={isLoggedIn}
        avatarUrl={profile?.avatar_url}
        nickname={profile?.username}
      />
      <SidebarNav
        isLoggedIn={isLoggedIn}
        avatarUrl={profile?.avatar_url}
        nickname={profile?.username}
      />

      <main className="pb-16 md:ml-60 md:pb-0">{children}</main>

      <BottomNav />
    </div>
  );
}
