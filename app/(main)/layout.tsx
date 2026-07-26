import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";
import { AppHeader } from "@/components/layout/app-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/**
 * (main) route group 공용 레이아웃 — AppHeader(모바일) + BottomNav(모바일) / SidebarNav(PC)
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(user.id) : null;
  const isLoggedIn = Boolean(user);

  return (
    <div className="bg-surface-muted min-h-screen">
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
