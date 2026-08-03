"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { RoomMember } from "@/lib/queries/rooms";

interface ParticipantListProps {
  participants: RoomMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onlineUserIds?: Set<string>;
}

function ParticipantRow({ participant, online }: { participant: RoomMember; online?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <div className="relative shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={participant.avatarUrl ?? undefined} alt={participant.nickname} />
          <AvatarFallback>{participant.nickname[0]}</AvatarFallback>
        </Avatar>
        {online && (
          <span className="border-surface absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" />
        )}
      </div>
      <span className="flex-1 text-sm font-medium">{participant.nickname}</span>
      {participant.isOwner && <Badge variant="secondary">방장</Badge>}
    </div>
  );
}

/**
 * 방채팅 참여자 패널 — 모바일은 Dialog(시트 형태), PC는 상시 노출 패널로 별도 렌더링
 */
export function ParticipantList({
  participants,
  open,
  onOpenChange,
  onlineUserIds,
}: ParticipantListProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] overflow-y-auto md:hidden">
        <DialogHeader>
          <DialogTitle>참여자 {participants.length}명</DialogTitle>
        </DialogHeader>
        <div className="divide-y">
          {participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} online={onlineUserIds?.has(p.id)} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * PC 전용 우측 상시 참여자 패널
 */
export function ParticipantSidePanel({
  participants,
  onlineUserIds,
}: {
  participants: RoomMember[];
  onlineUserIds?: Set<string>;
}) {
  return (
    <aside className="bg-surface hidden w-64 shrink-0 border-l p-3 md:block">
      <p className="text-muted-foreground px-1 pb-2 text-xs font-semibold">
        참여자 {participants.length}명
        {onlineUserIds && <span className="text-green-600"> · 온라인 {onlineUserIds.size}명</span>}
      </p>
      <div className="divide-y">
        {participants.map((p) => (
          <ParticipantRow key={p.id} participant={p} online={onlineUserIds?.has(p.id)} />
        ))}
      </div>
    </aside>
  );
}
