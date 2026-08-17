"use client";

import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useDmUnreadBadge } from "@/lib/realtime/dm-badge";

interface MainNavProps {
  isLoggedIn: boolean;
  avatarUrl?: string | null;
  nickname?: string | null;
  /** 로그인 회원(게스트 제외)일 때만 전달 — null이면 배지 실시간 구독 자체를 하지 않는다 */
  userId: string | null;
  initialUnreadDmCount: number;
}

/**
 * SidebarNav(PC)와 BottomNav(모바일)를 함께 감싸는 wrapper.
 *
 * 두 네비게이션 컴포넌트는 반응형 클래스(`md:hidden`/`md:flex`)로 화면 크기에 따라 숨겨질
 * 뿐 둘 다 항상 DOM에 마운트되어 있다. 안읽음 배지 실시간 구독(`useDmUnreadBadge`)을 각
 * 컴포넌트 안에 따로 넣으면 같은 화면에서 동일한 Realtime 채널이 두 번 열리는 꼴이 된다
 * (§CLAUDE.md "같은 화면에서 여러 하트비트가 겹치지 않는지 확인할 것"과 같은 종류의 함정).
 * 이 wrapper가 훅을 한 번만 호출해 두 컴포넌트에 같은 값을 내려준다.
 */
export function MainNav({
  isLoggedIn,
  avatarUrl,
  nickname,
  userId,
  initialUnreadDmCount,
}: MainNavProps) {
  const unreadDmCount = useDmUnreadBadge(initialUnreadDmCount, userId);

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
