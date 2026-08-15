"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TransitionLink } from "@/components/ui/transition-link";
import {
  Home,
  Shuffle,
  MessagesSquare,
  Search,
  UserRound,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdBanner } from "@/components/layout/ad-banner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { signOut } from "@/app/actions/auth";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/random", label: "랜덤채팅", icon: Shuffle },
  { href: "/rooms", label: "방 목록", icon: MessagesSquare },
  { href: "/search", label: "검색", icon: Search },
  { href: "/profile", label: "내 정보", icon: UserRound },
] as const;

interface SidebarNavProps {
  isLoggedIn: boolean;
  avatarUrl?: string | null;
  nickname?: string | null;
}

/**
 * PC 전용 좌측 고정 네비게이션
 *
 * 하단에 AdBanner → 로그인 시 프로필 요약 카드 / 비로그인 시 로그인·회원가입 버튼 → 다크모드 토글 순으로 배치한다.
 */
export function SidebarNav({ isLoggedIn, avatarUrl, nickname }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className="bg-surface fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r p-4 md:flex">
      <Link href="/" className="mb-6 px-2 text-xl font-bold">
        💬 수다온
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <TransitionLink
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-(--radius-card) px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-muted text-brand"
                  : "text-muted-foreground hover:bg-surface-muted"
              )}
            >
              <Icon size={18} />
              {label}
            </TransitionLink>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <AdBanner variant="sidebar" />
        {isLoggedIn ? (
          <>
            <Link
              href="/profile"
              className="bg-surface-muted hover:bg-surface flex items-center gap-3 rounded-(--radius-card) border p-3"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl ?? undefined} alt={nickname ?? "프로필"} />
                <AvatarFallback>{nickname?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{nickname ?? "닉네임 없음"}</p>
                <p className="text-muted-foreground text-xs">내 정보 보기</p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </Link>
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground w-full justify-start gap-3 px-3"
              >
                <LogOut size={18} />
                로그아웃
              </Button>
            </form>
          </>
        ) : (
          <Link href="/auth/login">
            <Button className="bg-brand hover:bg-brand/90 text-brand-foreground w-full rounded-(--radius-card)">
              로그인 / 회원가입
            </Button>
          </Link>
        )}
        <div className="flex justify-end px-1">
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}
