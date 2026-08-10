"use client";

import Link from "next/link";
import { ChevronLeft, Flag, LogOut, MoreVertical, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  title: string;
  backHref: string;
  memberCount?: number;
  maxMembers?: number;
  onOpenParticipants?: () => void;
  safetyLabel?: string;
  onLeave?: () => void;
  leaveLabel?: string;
  /** "더보기" 드롭다운의 "신고하기" 항목 클릭 핸들러 — 없으면 더보기 메뉴 자체가 숨겨진다 */
  onReport?: () => void;
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
  onLeave,
  leaveLabel = "나가기",
  onReport,
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenParticipants}
          aria-label="참여자 목록"
          className="md:hidden"
        >
          <Users size={18} />
        </Button>
      )}

      {onReport && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="더보기">
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onReport}
              className="text-destructive focus:text-destructive"
            >
              <Flag className="mr-2 h-4 w-4" />
              신고하기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {onLeave && (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive gap-1 text-xs"
          onClick={onLeave}
        >
          <LogOut size={14} />
          {leaveLabel}
        </Button>
      )}

      {!onReport && !onLeave && (
        <Button variant="ghost" size="icon" aria-label="더보기">
          <MoreVertical size={18} />
        </Button>
      )}
    </header>
  );
}
