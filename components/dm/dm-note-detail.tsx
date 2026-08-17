"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TransitionLink } from "@/components/ui/transition-link";
import { markDmNoteReadAction, sendDmNoteAction } from "@/app/actions/dm";
import { formatChatDate, formatChatTime } from "@/lib/utils/date";
import { showError, showSuccess } from "@/lib/utils/toast";
import type { DmNoteDetail } from "@/lib/queries/dm";

interface DmNoteDetailViewProps {
  note: DmNoteDetail;
}

/**
 * 쪽지 상세/답장 화면 — 채팅 버블이 아니라 "편지" 형태에 가깝게 구성한다(§ROADMAP Phase 11
 * 재설계, 방채팅 UI를 그대로 베끼지 말 것). 답장은 원본을 참조하는 새 쪽지 1건을 보낼 뿐,
 * 이 화면 자체가 이어지는 대화창이 되지는 않는다 — 답장 전송 후에는 목록으로 돌아간다.
 */
export function DmNoteDetailView({ note }: DmNoteDetailViewProps) {
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const markedAsReadRef = useRef(false);

  // 받은 쪽지를 열람하면 1회만 읽음 처리한다. 목록/네비게이션 배지는 서버 액션의
  // revalidatePath("/", "layout")로 갱신된다.
  useEffect(() => {
    if (note.direction === "received" && !markedAsReadRef.current) {
      markedAsReadRef.current = true;
      void markDmNoteReadAction(note.id);
    }
  }, [note.id, note.direction]);

  const handleSendReply = async () => {
    const trimmed = replyContent.trim();
    if (!trimmed) return;

    setSending(true);
    const result = await sendDmNoteAction(note.partnerId, trimmed, note.id);
    setSending(false);

    if (!result.success) {
      showError(result.message);
      return;
    }

    showSuccess("답장을 보냈습니다.");
    router.push("/dm");
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <TransitionLink href="/dm">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1">
          <ChevronLeft size={16} />
          목록으로
        </Button>
      </TransitionLink>

      <div className="bg-surface space-y-4 rounded-(--radius-card) border p-5">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={note.partnerAvatarUrl ?? undefined} alt={note.partnerNickname} />
            <AvatarFallback>{note.partnerNickname[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {note.direction === "received"
                ? `${note.partnerNickname}님이 보낸 쪽지`
                : `${note.partnerNickname}님에게 보낸 쪽지`}
            </p>
            <p className="text-muted-foreground text-xs" suppressHydrationWarning>
              {formatChatDate(note.createdAt)} · {formatChatTime(note.createdAt)}
            </p>
          </div>
        </div>

        {note.replyTo && (
          <div className="bg-surface-muted text-muted-foreground border-brand/40 space-y-0.5 rounded-(--radius-card) border-l-2 px-3 py-2 text-xs">
            <p className="font-medium">{note.replyTo.senderNickname}님의 쪽지에 대한 답장</p>
            <p className="line-clamp-2">{note.replyTo.contentPreview}</p>
          </div>
        )}

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
      </div>

      {/* 답장은 받은 쪽지에만 가능하다 — 내가 보낸 쪽지 상세는 열람 전용이다(§후속 개선
          2026-08-17). 서버(send_dm_note)도 reply_to_id의 원본 수신자가 호출자 본인인지
          재검증하므로, 이 UI를 우회해 API를 직접 호출해도 자기가 보낸 쪽지에는 답장할 수 없다. */}
      {note.direction === "received" &&
        (replying ? (
          <div className="space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`${note.partnerNickname}님에게 답장하기`}
              rows={5}
              disabled={sending}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReplying(false)} disabled={sending}>
                취소
              </Button>
              <Button
                className="bg-brand hover:bg-brand/90 text-brand-foreground"
                onClick={() => void handleSendReply()}
                disabled={sending || !replyContent.trim()}
              >
                {sending ? "보내는 중..." : "답장 보내기"}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full gap-2" onClick={() => setReplying(true)}>
            <Reply size={16} />
            답장하기
          </Button>
        ))}
    </div>
  );
}
