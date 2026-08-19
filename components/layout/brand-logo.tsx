import { cn } from "@/lib/utils";

/**
 * 달나루 로고 워드마크 — 달 아이콘 + 고운바탕(display) 서체 텍스트.
 * 헤더/사이드바/관리자 사이드바에서 공통으로 쓴다.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" className="fill-brand" />
      </svg>
      <span style={{ fontFamily: "var(--font-display)" }}>달나루</span>
    </span>
  );
}
