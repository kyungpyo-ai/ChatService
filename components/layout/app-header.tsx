import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/layout/brand-logo";

interface AppHeaderProps {
  isLoggedIn: boolean;
  avatarUrl?: string | null;
  nickname?: string | null;
}

/**
 * 모바일 전용 상단 헤더 — 로고 + 아바타
 *
 * 비로그인 시 아바타 클릭은 /auth/login으로 이동한다(모바일 로그인 진입점 일원화).
 */
export function AppHeader({ isLoggedIn, avatarUrl, nickname }: AppHeaderProps) {
  const avatarHref = isLoggedIn ? "/profile" : "/auth/login";

  return (
    <header className="bg-surface/95 sticky top-0 z-40 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:hidden">
      <Link href="/" className="text-lg font-bold">
        <BrandLogo />
      </Link>
      <div className="flex items-center gap-1">
        <Link
          href={avatarHref}
          aria-label={isLoggedIn ? "내 정보" : "로그인"}
          className="flex h-9 w-9 items-center justify-center"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl ?? undefined} alt={nickname ?? "프로필"} />
            <AvatarFallback>{nickname?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
