"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RoomMember } from "@/lib/queries/rooms";

interface ParticipantListProps {
  participants: RoomMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onlineUserIds?: Set<string>;
  currentUserId?: string;
  isOwner?: boolean;
  onKick?: (targetUserId: string) => void;
}

function ParticipantRow({
  participant,
  online,
  canKick,
  onKickClick,
}: {
  participant: RoomMember;
  online?: boolean;
  canKick?: boolean;
  onKickClick?: () => void;
}) {
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
      <span className="flex-1 truncate text-sm font-medium">{participant.nickname}</span>
      {participant.isOwner && <Badge variant="secondary">방장</Badge>}
      {canKick && (
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onKickClick}>
          강퇴
        </Button>
      )}
    </div>
  );
}

/**
 * 강퇴 확인 다이얼로그 — 방장에게만 노출되는 강퇴 버튼 클릭 시 뜬다(§ROADMAP Phase 7).
 * 대상 닉네임은 부모가 들고 있는 participants에서 조회해 전달한다.
 */
function KickConfirmDialog({
  nickname,
  onOpenChange,
  onConfirm,
}: {
  nickname: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={nickname !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{nickname}님을 강퇴하시겠어요?</DialogTitle>
          <DialogDescription>강퇴된 사용자는 이 방에 다시 입장할 수 없습니다.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            강퇴
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  currentUserId,
  isOwner,
  onKick,
}: ParticipantListProps) {
  const [kickTargetId, setKickTargetId] = useState<string | null>(null);
  const kickTarget = participants.find((p) => p.id === kickTargetId) ?? null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[70vh] overflow-y-auto md:hidden">
          <DialogHeader>
            <DialogTitle>참여자 {participants.length}명</DialogTitle>
          </DialogHeader>
          <div className="divide-y">
            {participants.map((p) => (
              <ParticipantRow
                key={p.id}
                participant={p}
                online={onlineUserIds?.has(p.id)}
                canKick={isOwner && !p.isOwner && p.id !== currentUserId}
                onKickClick={() => setKickTargetId(p.id)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {onKick && (
        <KickConfirmDialog
          nickname={kickTarget?.nickname ?? null}
          onOpenChange={(next) => !next && setKickTargetId(null)}
          onConfirm={() => {
            if (kickTargetId) onKick(kickTargetId);
            setKickTargetId(null);
          }}
        />
      )}
    </>
  );
}

/**
 * PC 전용 우측 상시 참여자 패널
 */
export function ParticipantSidePanel({
  participants,
  onlineUserIds,
  currentUserId,
  isOwner,
  onKick,
}: {
  participants: RoomMember[];
  onlineUserIds?: Set<string>;
  currentUserId?: string;
  isOwner?: boolean;
  onKick?: (targetUserId: string) => void;
}) {
  const [kickTargetId, setKickTargetId] = useState<string | null>(null);
  const kickTarget = participants.find((p) => p.id === kickTargetId) ?? null;

  return (
    <aside className="bg-surface hidden w-64 shrink-0 border-l p-3 md:block">
      <p className="text-muted-foreground px-1 pb-2 text-xs font-semibold">
        참여자 {participants.length}명
        {onlineUserIds && <span className="text-green-600"> · 온라인 {onlineUserIds.size}명</span>}
      </p>
      <div className="divide-y">
        {participants.map((p) => (
          <ParticipantRow
            key={p.id}
            participant={p}
            online={onlineUserIds?.has(p.id)}
            canKick={isOwner && !p.isOwner && p.id !== currentUserId}
            onKickClick={() => setKickTargetId(p.id)}
          />
        ))}
      </div>
      {onKick && (
        <KickConfirmDialog
          nickname={kickTarget?.nickname ?? null}
          onOpenChange={(next) => !next && setKickTargetId(null)}
          onConfirm={() => {
            if (kickTargetId) onKick(kickTargetId);
            setKickTargetId(null);
          }}
        />
      )}
    </aside>
  );
}
