import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavPendingIcon } from "@/components/home/nav-pending-icon";

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
        "flex items-center gap-4 rounded-(--radius-card) border p-4 shadow-(--shadow-card) transition-[transform,filter] active:scale-[0.99]",
        isBrand
          ? "bg-brand-gradient text-brand-foreground border-transparent hover:brightness-105"
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
      <NavPendingIcon isBrand={isBrand} />
    </Link>
  );
}
