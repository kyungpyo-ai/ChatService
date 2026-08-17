import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";
import { getDmUnreadCount } from "@/lib/queries/dm";
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

  // 랜덤채팅에서 발급되는 익명(guest) 세션은 auth.users에는 존재하지만 profiles가 아닌
  // guest_profiles에 저장된다(§20260804145603) — user만으로 판단하면 랜덤채팅을 한 번이라도
  // 쓴 브라우저가 이후 모든 페이지에서 "로그인됨(닉네임 없음)"으로 잘못 표시된다.
  const isLoggedIn = Boolean(profile);

  // 쪽지함 안읽음 배지(§ROADMAP Phase 11 재설계) — 실시간 구독이 아니라 이 레이아웃이
  // 렌더될 때마다(페이지 이동·서버 액션의 revalidatePath("/", "layout") 이후) 다시 계산된다.
  // 방채팅 수준의 즉시성이 필요 없다는 요구사항에 맞춘 최소 구현이다.
  const unreadDmCount = isLoggedIn ? await getDmUnreadCount(user!.id) : 0;

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
        unreadDmCount={unreadDmCount}
      />

      <main className="pb-16 md:ml-60 md:pb-0">{children}</main>

      <BottomNav unreadDmCount={unreadDmCount} />
    </div>
  );
}
