"use client";

import { usePathname } from "next/navigation";
import { Home, Shuffle, MessagesSquare, Search, Mail, UserRound } from "lucide-react";
import { TransitionLink } from "@/components/ui/transition-link";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/random", label: "랜덤", icon: Shuffle },
  { href: "/rooms", label: "방 목록", icon: MessagesSquare },
  { href: "/search", label: "검색", icon: Search },
  { href: "/dm", label: "쪽지", icon: Mail },
  { href: "/profile", label: "내 정보", icon: UserRound },
] as const;

interface BottomNavProps {
  /** 쪽지 탭에 표시할 안읽음 개수 — 0이면 배지를 표시하지 않는다 */
  unreadDmCount?: number;
}

/**
 * 모바일 전용 하단 고정 6탭 네비게이션
 */
export function BottomNav({ unreadDmCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-surface/95 fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t backdrop-blur md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <TransitionLink
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              isActive ? "text-brand font-semibold" : "text-muted-foreground"
            )}
          >
            <span className="relative">
              <Icon size={20} />
              {href === "/dm" && unreadDmCount > 0 && (
                <span className="bg-destructive absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] font-semibold text-white">
                  {unreadDmCount > 9 ? "9+" : unreadDmCount}
                </span>
              )}
            </span>
            {label}
          </TransitionLink>
        );
      })}
    </nav>
  );
}
