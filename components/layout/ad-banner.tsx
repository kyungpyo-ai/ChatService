import { cn } from "@/lib/utils";

interface AdBannerProps {
  variant?: "inline" | "sidebar";
  className?: string;
}

/**
 * 실제 광고가 붙기 전까지는 이 값만 true로 바꾸면 기존 호출부(홈/방목록/사이드바)
 * 수정 없이 다시 노출된다.
 */
const AD_ENABLED = false;

/**
 * 광고 영역 placeholder — 실제 광고 SDK 연동은 범위 외(§7.4 후속 검토)
 */
export function AdBanner({ variant = "inline", className }: AdBannerProps) {
  if (!AD_ENABLED) return null;

  return (
    <div
      className={cn(
        "bg-surface-muted text-muted-foreground flex items-center gap-2 rounded-(--radius-card) border border-dashed px-4 py-3 text-xs",
        variant === "sidebar" && "justify-center py-6 text-center",
        className
      )}
    >
      <span className="bg-muted rounded px-1.5 py-0.5 font-semibold">AD</span>
      <span>광고 영역</span>
    </div>
  );
}
