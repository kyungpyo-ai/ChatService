"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TransitionLink } from "@/components/ui/transition-link";
import { markDmNoteReadAction, sendDmNoteAction } from "@/app/actions/dm";
import { triggerDmBadgeResync } from "@/lib/realtime/dm-badge-bus";
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

  // 받은 쪽지를 열람하면 1회만 읽음 처리한다. 서버 액션의 revalidatePath("/", "layout")와
  // router.refresh()만으로는 반영 타이밍이 항상 보장되지 않아(§실사용 확인 2026-08-18,
  // "읽었는데도 배지가 안 사라질 때가 있음") triggerDmBadgeResync()로 useDmUnreadBadge에
  // "지금 당장 다시 세줘"라는 신호를 직접 보낸다(§lib/realtime/dm-badge-bus.ts).
  // router.refresh()는 그대로 유지 — 이 화면 자체가 다시 그려질 다른 서버 데이터가 있을 수
  // 있으니 그것과는 별개로 필요하다.
  useEffect(() => {
    if (note.direction === "received" && !markedAsReadRef.current) {
      markedAsReadRef.current = true;
      void markDmNoteReadAction(note.id).then((result) => {
        if (result.success) {
          triggerDmBadgeResync();
          router.refresh();
        }
      });
    }
  }, [note.id, note.direction, router]);

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
