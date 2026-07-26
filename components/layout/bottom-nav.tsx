"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shuffle, MessagesSquare, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/random", label: "랜덤", icon: Shuffle },
  { href: "/rooms", label: "방 목록", icon: MessagesSquare },
  { href: "/search", label: "검색", icon: Search },
  { href: "/profile", label: "내 정보", icon: UserRound },
] as const;

/**
 * 모바일 전용 하단 고정 5탭 네비게이션
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface/95 fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t backdrop-blur md:hidden">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px]",
              isActive ? "text-brand font-semibold" : "text-muted-foreground"
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
