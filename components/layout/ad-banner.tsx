import { cn } from "@/lib/utils";

interface AdBannerProps {
  variant?: "inline" | "sidebar";
  className?: string;
}

/**
 * 광고 영역 placeholder — 실제 광고 SDK 연동은 범위 외(§7.4 후속 검토)
 */
export function AdBanner({ variant = "inline", className }: AdBannerProps) {
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
