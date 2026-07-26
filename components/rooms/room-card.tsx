import Link from "next/link";
import { Lock, Users, Mars, Venus } from "lucide-react";
import type { MockRoom } from "@/lib/mock/rooms";

interface RoomCardProps {
  room: MockRoom;
}

function formatCreatedAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}분 전 생성`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 전 생성`;
}

/**
 * 방 목록 아이템 — 제목, 인원, 방장 배지(+성별·나이, 둘 다 필수 항목이라 항상 표시), 생성 시각, 비밀방 자물쇠 배지
 *
 * 사용자가 제공한 UIUX 샘플(docs/UIUX/방목록 화면 sample 디자인.png)의 카드 레이아웃을 따른다.
 */
export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="bg-surface hover:bg-surface-muted relative block rounded-(--radius-card) border p-4 shadow-(--shadow-card)"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-base font-bold">{room.title}</p>
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

      <p className="text-muted-foreground mt-1.5 text-xs">
        {formatCreatedAgo(room.createdMinutesAgo)}
      </p>

      {room.isPrivate && (
        <span className="bg-brand-muted text-brand absolute right-4 bottom-4 flex h-7 w-7 items-center justify-center rounded-lg">
          <Lock size={14} />
        </span>
      )}
    </Link>
  );
}
