"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useDmBadgeCount } from "@/components/dm/dm-badge-provider";

interface MainNavProps {
  isLoggedIn: boolean;
  avatarUrl?: string | null;
  nickname?: string | null;
}

/**
 * SidebarNav(PC)와 BottomNav(모바일)를 함께 감싸는 wrapper.
 *
 * 안읽음 배지 값은 `app/layout.tsx`에 마운트된 `DmBadgeProvider`의 Realtime 구독에서
 * `useDmBadgeCount()`로 읽어온다 — 이 컴포넌트 자체는 `/random` 등을 오갈 때 언마운트/
 * 재마운트되지만, 구독은 그 위(앱 최상위)에서 계속 살아있으므로 값만 다시 읽으면 된다
 * (§lib/realtime/dm-badge.ts, §components/dm/dm-badge-provider.tsx 참고).
 */
export function MainNav({ isLoggedIn, avatarUrl, nickname }: MainNavProps) {
  const unreadDmCount = useDmBadgeCount();

  return (
    <>
      <SidebarNav
        isLoggedIn={isLoggedIn}
        avatarUrl={avatarUrl}
        nickname={nickname}
        unreadDmCount={unreadDmCount}
      />
      <BottomNav unreadDmCount={unreadDmCount} />
    </>
  );
}
