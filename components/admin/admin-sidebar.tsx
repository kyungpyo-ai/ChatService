"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Shuffle,
  Users,
  Flag,
  Server,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}[] = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/stats", label: "일자별 통계", icon: BarChart3 },
  { href: "/admin/rooms", label: "방채팅", icon: MessagesSquare },
  { href: "/admin/random", label: "랜덤채팅", icon: Shuffle },
  { href: "/admin/messages", label: "메시지 검색", icon: MessageSquare },
  { href: "/admin/users", label: "회원", icon: Users },
  { href: "/admin/reports", label: "신고", icon: Flag },
  { href: "/admin/system", label: "시스템", icon: Server },
];

/**
 * 관리자 전용 좌측 네비 — 일반 SidebarNav와 별도 컴포넌트로 분리(권한 성격이 다른 화면을
 * 같은 컴포넌트에 조건부로 섞지 않기 위해, §DEVELOPMENT_PLAN 7.5.4). "아카이브"는 별도
 * 메뉴 없이 방채팅/랜덤채팅 화면 내부의 "진행 중"/"종료됨" 탭으로 흡수되어 있다.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-surface hidden w-56 shrink-0 flex-col border-r p-4 md:fixed md:inset-y-0 md:flex">
      <Link href="/admin" className="mb-6 flex items-center gap-1.5 px-2 text-lg font-bold">
        <BrandLogo />
        <span className="text-muted-foreground text-sm font-normal">관리자</span>
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand text-brand-foreground"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-4">
        <Link href="/" className="text-muted-foreground text-xs hover:underline">
          서비스 화면으로 돌아가기
        </Link>
      </div>
    </aside>
  );
}
