import { Lock, Users, Mars, Venus } from "lucide-react";
import { TransitionLink } from "@/components/ui/transition-link";
import type { RoomListItem } from "@/lib/queries/rooms";

interface RoomCardProps {
  room: RoomListItem;
  currentUserId?: string;
}

function formatCreatedAgo(createdAt: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 60) return `${minutes}분 전 생성`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 전 생성`;
}

/**
 * 방 목록 아이템 — 제목, 인원, 방장 배지(+성별·나이, 둘 다 필수 항목이라 항상 표시), 생성 시각, 비밀방 자물쇠 배지
 *
 * 사용자가 제공한 UIUX 샘플(docs/UIUX/방목록 화면 sample 디자인.png)의 카드 레이아웃을 따른다.
 */
export function RoomCard({ room, currentUserId }: RoomCardProps) {
  const isMine = room.ownerId === currentUserId;

  return (
    <TransitionLink
      href={`/rooms/${room.id}`}
      // app/(main)/rooms/[roomId]/page.tsx는 비참여자가 접근하면 렌더링 중에 join_room()을
      // 호출해 자동 입장시킨다 — prefetch가 켜져 있으면 카드가 뷰포트에 보이기만 해도(클릭
      // 없이) 이 렌더링이 미리 실행되어 조용히 재입장되는 버그가 있었다(예: 방 나가기 직후
      // 목록으로 돌아오면 그 방 카드가 다시 보이면서 즉시 재입장됨). prefetch를 꺼서 실제
      // 클릭 시에만 입장이 일어나게 한다.
      prefetch={false}
      className={
        isMine
          ? "bg-surface hover:bg-surface-muted border-brand relative block rounded-(--radius-card) border-2 p-4 shadow-(--shadow-card)"
          : "bg-surface hover:bg-surface-muted relative block rounded-(--radius-card) border p-4 shadow-(--shadow-card)"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate text-base font-bold">{room.title}</p>
          {isMine && (
            <span className="bg-brand-gradient text-brand-foreground shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold">
              내가 만든 방
            </span>
          )}
        </div>
        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-sm tabular-nums">
          <Users size={14} />
          {room.memberCount}/{room.maxMembers}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-sm">
        <span className="bg-brand-muted text-brand rounded px-1.5 py-0.5 text-xs font-semibold">
          방장
        </span>
        {/* 닉네임은 최대 6자(lib/schemas/profile.ts)로 제한되므로 고정 폭으로도 잘리지 않는다 */}
        <span className="w-24 shrink-0 truncate font-medium">{room.ownerNickname}</span>
        {room.ownerGender === "male" ? (
          <Mars size={14} className="shrink-0 text-blue-500" />
        ) : (
          <Venus size={14} className="shrink-0 text-pink-500" />
        )}
        <span className="text-muted-foreground shrink-0 text-xs">{room.ownerAge}세</span>
      </div>

      <p className="text-muted-foreground mt-1.5 text-xs">{formatCreatedAgo(room.createdAt)}</p>

      {room.isPrivate && (
        <span className="bg-brand-muted text-brand absolute right-4 bottom-4 flex h-7 w-7 items-center justify-center rounded-lg">
          <Lock size={14} />
        </span>
      )}
    </TransitionLink>
  );
}
