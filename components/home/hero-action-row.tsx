"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { ChevronRight, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroActionRowProps {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  variant?: "brand" | "default";
}

/**
 * 홈 화면의 가로로 긴 리스트형 CTA 카드 (좌측 아이콘 + 제목/부제 + 우측 화살표)
 */
export function HeroActionRow({
  href,
  icon: Icon,
  title,
  subtitle,
  variant = "default",
}: HeroActionRowProps) {
  const isBrand = variant === "brand";

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 rounded-(--radius-card) border p-4 shadow-(--shadow-card) transition-transform active:scale-[0.99]",
        isBrand
          ? "bg-brand text-brand-foreground border-transparent"
          : "bg-surface hover:bg-surface-muted"
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          isBrand ? "bg-white/20" : "bg-brand-muted text-brand"
        )}
      >
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p
          className={cn(
            "truncate text-sm",
            isBrand ? "text-brand-foreground/80" : "text-muted-foreground"
          )}
        >
          {subtitle}
        </p>
      </div>
      <NavIcon isBrand={isBrand} />
    </Link>
  );
}

/**
 * useLinkStatus는 부모 <Link>의 자식으로 렌더링된 컴포넌트에서만 pending 상태를 읽을 수 있다.
 * 클릭 즉시(네트워크 왕복 전) 스피너로 바뀌어야 "버튼이 반응했다"는 걸 바로 알 수 있다
 * (§실사용 피드백 — 버튼 클릭 후 아무 반응 없이 멈춘 것처럼 보이는 문제).
 */
function NavIcon({ isBrand }: { isBrand: boolean }) {
  const { pending } = useLinkStatus();
  const className = isBrand ? "text-brand-foreground/80" : "text-muted-foreground";

  if (pending) {
    return <Loader2 size={20} className={cn("animate-spin", className)} />;
  }

  return <ChevronRight size={20} className={className} />;
}
