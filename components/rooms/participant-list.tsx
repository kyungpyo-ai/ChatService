"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MockParticipant } from "@/lib/mock/participants";

interface ParticipantListProps {
  participants: MockParticipant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ParticipantRow({ participant }: { participant: MockParticipant }) {
  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <Avatar className="h-9 w-9">
        <AvatarImage src={participant.avatarUrl} alt={participant.nickname} />
        <AvatarFallback>{participant.nickname[0]}</AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm font-medium">{participant.nickname}</span>
      {participant.isOwner && <Badge variant="secondary">방장</Badge>}
    </div>
  );
}

/**
 * 방채팅 참여자 패널 — 모바일은 Dialog(시트 형태), PC는 상시 노출 패널로 별도 렌더링
 */
export function ParticipantList({ participants, open, onOpenChange }: ParticipantListProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] overflow-y-auto md:hidden">
        <DialogHeader>
          <DialogTitle>참여자 {participants.length}명</DialogTitle>
        </DialogHeader>
        <div className="divide-y">
          {participants.map((p) => (
            <ParticipantRow key={p.id} participant={p} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * PC 전용 우측 상시 참여자 패널
 */
export function ParticipantSidePanel({ participants }: { participants: MockParticipant[] }) {
  return (
    <aside className="bg-surface hidden w-64 shrink-0 border-l p-3 lg:block">
      <p className="text-muted-foreground px-1 pb-2 text-xs font-semibold">
        참여자 {participants.length}명
      </p>
      <div className="divide-y">
        {participants.map((p) => (
          <ParticipantRow key={p.id} participant={p} />
        ))}
      </div>
    </aside>
  );
}
