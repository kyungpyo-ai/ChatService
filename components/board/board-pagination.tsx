import { ChevronLeft, ChevronRight } from "lucide-react";
import { TransitionLink } from "@/components/ui/transition-link";
import { cn } from "@/lib/utils";

interface BoardPaginationProps {
  currentPage: number;
  totalPages: number;
  /** 페이지 번호를 받아 이동할 URL을 만든다 — 태그 필터 등 다른 쿼리 파라미터를 유지하기 위해 호출부에서 조립한다. */
  buildHref: (page: number) => string;
}

/** 게시판 목록 페이지 이동 — components/dm/dm-pagination.tsx와 동일한 패턴. */
export function BoardPagination({ currentPage, totalPages, buildHref }: BoardPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <TransitionLink
        href={hasPrev ? buildHref(currentPage - 1) : "#"}
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
        href={hasNext ? buildHref(currentPage + 1) : "#"}
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
