import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TransitionLink } from "@/components/ui/transition-link";
import { formatChatTime } from "@/lib/utils/date";
import type { DmConversationListItem } from "@/lib/queries/dm";

interface DmConversationListProps {
  conversations: DmConversationListItem[];
}

/**
 * 내 쪽지 대화 목록 — 상대 닉네임/아바타 + 마지막 메시지 미리보기, 최근 메시지 시각순 정렬.
 * 안 읽음 표시/알림 배지는 1차 버전 범위 제외(§ROADMAP Phase 11).
 */
export function DmConversationList({ conversations }: DmConversationListProps) {
  if (conversations.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        아직 주고받은 쪽지가 없어요. 검색에서 대화하고 싶은 상대를 찾아보세요.
      </p>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((c) => (
        <TransitionLink
          key={c.id}
          href={`/dm/${c.id}`}
          className="hover:bg-surface-muted flex items-center gap-3 rounded-(--radius-card) px-2 py-3"
        >
          <Avatar className="h-11 w-11">
            <AvatarImage src={c.partnerAvatarUrl ?? undefined} alt={c.partnerNickname} />
            <AvatarFallback>{c.partnerNickname[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{c.partnerNickname}</p>
            <p className="text-muted-foreground truncate text-xs">
              {c.lastMessagePreview ?? "대화를 시작해보세요"}
            </p>
          </div>
          <span className="text-muted-foreground shrink-0 text-[11px]" suppressHydrationWarning>
            {formatChatTime(c.lastMessageAt)}
          </span>
        </TransitionLink>
      ))}
    </div>
  );
}
