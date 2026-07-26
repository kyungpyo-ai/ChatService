"use client";

import { useState } from "react";
import { Megaphone, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinnedNoticeBarProps {
  notice: string;
}

/**
 * 방채팅 헤더 아래 고정 공지 배너 — 펼침용 화살표 클릭 시 공지 상세 표시(Phase 2에서는 UI만)
 */
export function PinnedNoticeBar({ notice }: PinnedNoticeBarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className="bg-brand-muted text-brand flex w-full items-center gap-2 border-b px-4 py-2 text-left text-xs"
    >
      <Megaphone size={14} className="shrink-0" />
      <span className={cn("min-w-0 flex-1", !expanded && "truncate")}>{notice}</span>
      <ChevronRight
        size={14}
        className={cn("shrink-0 transition-transform", expanded && "rotate-90")}
      />
    </button>
  );
}
