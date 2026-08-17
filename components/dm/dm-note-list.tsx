"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, MoreVertical, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransitionLink } from "@/components/ui/transition-link";
import { hideDmNoteAction } from "@/app/actions/dm";
import { formatNoteDate } from "@/lib/utils/date";
import { showError } from "@/lib/utils/toast";
import { cn } from "@/lib/utils";
import type { DmNoteListItem } from "@/lib/queries/dm";

interface DmNoteListProps {
  notes: DmNoteListItem[];
}

/**
 * 쪽지함 통합 목록 — 받은함/보낸함 탭 분리 없이 방향(받음/보냄) 아이콘으로만 구분한다
 * (§ROADMAP Phase 11 재설계). 항목 클릭 시 상세/답장 화면(`/dm/[noteId]`)으로 이동하고,
 * "..." 메뉴에서 항목 단위 소프트 삭제(나만 안 보이게)를 할 수 있다.
 */
export function DmNoteList({ notes: initialNotes }: DmNoteListProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);

  const handleDelete = async (noteId: string) => {
    const prevNotes = notes;
    setNotes((current) => current.filter((note) => note.id !== noteId));

    const result = await hideDmNoteAction(noteId);
    if (!result.success) {
      showError(result.message);
      setNotes(prevNotes);
      return;
    }

    // 로컬에서는 낙관적으로 목록에서만 지웠을 뿐이다 — 삭제한 쪽지가 안읽음 상태였다면
    // 네비게이션 배지도 갱신되어야 하므로, 서버 액션의 revalidatePath만 믿지 않고
    // router.refresh()로 현재 라우트(레이아웃 포함)를 명시적으로 다시 가져온다
    // (§components/dm/dm-note-detail.tsx와 동일한 이유, 실사용 확인 2026-08-17).
    router.refresh();
  };

  if (notes.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        아직 주고받은 쪽지가 없어요. 검색에서 상대를 찾아 쪽지를 보내보세요.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {notes.map((note) => (
        <div key={note.id} className="hover:bg-surface-muted flex items-center gap-2 px-2 py-3">
          <TransitionLink
            href={`/dm/${note.id}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={note.partnerAvatarUrl ?? undefined} alt={note.partnerNickname} />
              <AvatarFallback>{note.partnerNickname[0]}</AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {note.direction === "received" ? (
                  <ArrowDownLeft size={13} className="text-brand shrink-0" aria-label="받은 쪽지" />
                ) : (
                  <ArrowUpRight
                    size={13}
                    className="text-muted-foreground shrink-0"
                    aria-label="보낸 쪽지"
                  />
                )}
                <p
                  className={cn(
                    "truncate text-sm",
                    note.isUnread ? "text-foreground font-semibold" : "font-medium"
                  )}
                >
                  {note.partnerNickname}
                </p>
                {note.isUnread && (
                  <span
                    className="bg-brand h-1.5 w-1.5 shrink-0 rounded-full"
                    aria-label="안읽음"
                  />
                )}
              </div>
              <p className="text-muted-foreground truncate text-xs">{note.contentPreview}</p>
            </div>
          </TransitionLink>

          <span className="text-muted-foreground shrink-0 text-[11px]" suppressHydrationWarning>
            {formatNoteDate(note.createdAt)}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="더보기" className="shrink-0">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => void handleDelete(note.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
    </div>
  );
}
