"use client";

import Link from "next/link";
import { ChevronLeft, MoreVertical, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  title: string;
  backHref: string;
  memberCount?: number;
  maxMembers?: number;
  onOpenParticipants?: () => void;
  safetyLabel?: string;
}

/**
 * 채팅 화면 상단 헤더 — 방채팅/랜덤채팅 공통 사용
 */
export function ChatHeader({
  title,
  backHref,
  memberCount,
  maxMembers,
  onOpenParticipants,
  safetyLabel = "안심",
}: ChatHeaderProps) {
  return (
    <header className="bg-surface/95 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 backdrop-blur">
      <Link href={backHref} aria-label="뒤로가기">
        <Button variant="ghost" size="icon" className="shrink-0">
          <ChevronLeft size={20} />
        </Button>
      </Link>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{title}</p>
        {typeof memberCount === "number" && (
          <p className="text-muted-foreground text-xs">
            {memberCount} / {maxMembers}
          </p>
        )}
      </div>

      <Button variant="ghost" size="sm" className="text-muted-foreground gap-1 text-xs">
        <ShieldCheck size={14} />
        {safetyLabel}
      </Button>

      {onOpenParticipants && (
        <Button variant="ghost" size="icon" onClick={onOpenParticipants} aria-label="참여자 목록">
          <Users size={18} />
        </Button>
      )}

      <Button variant="ghost" size="icon" aria-label="더보기">
        <MoreVertical size={18} />
      </Button>
    </header>
  );
}
