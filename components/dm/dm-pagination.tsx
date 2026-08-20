import { ChevronLeft, ChevronRight } from "lucide-react";
import { TransitionLink } from "@/components/ui/transition-link";
import { cn } from "@/lib/utils";

interface DmPaginationProps {
  currentPage: number;
  totalPages: number;
}

/** 쪽지함 목록 페이지 이동 — 한 페이지에 다 보여주면 너무 많아서 페이지 단위로 자른다(§실사용 확인). */
export function DmPagination({ currentPage, totalPages }: DmPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <TransitionLink
        href={hasPrev ? `/dm?page=${currentPage - 1}` : "#"}
        aria-disabled={!hasPrev}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border",
          hasPrev
            ? "hover:bg-surface-muted text-foreground"
            : "text-muted-foreground pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft size={16} />
      </TransitionLink>

      <span className="text-muted-foreground text-xs">
        {currentPage} / {totalPages}
      </span>

      <TransitionLink
        href={hasNext ? `/dm?page=${currentPage + 1}` : "#"}
        aria-disabled={!hasNext}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border",
          hasNext
            ? "hover:bg-surface-muted text-foreground"
            : "text-muted-foreground pointer-events-none opacity-40"
        )}
      >
        <ChevronRight size={16} />
      </TransitionLink>
    </div>
  );
}
