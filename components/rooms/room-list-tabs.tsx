"use client";

import { useState } from "react";
import { RoomCard } from "@/components/rooms/room-card";
import type { RoomListItem } from "@/lib/queries/rooms";
import { cn } from "@/lib/utils";

interface RoomListTabsProps {
  rooms: RoomListItem[];
  myRooms: RoomListItem[];
  isLoggedIn: boolean;
  currentUserId?: string;
  children?: React.ReactNode;
}

/**
 * 방 목록 탭 — "전체 방"/"내가 참여중인 방"을 URL 이동 없이 클라이언트 state로 전환한다.
 *
 * 이전에는 `/rooms`, `/rooms?tab=mine` 두 URL로 분리해 서버에서 각각 다시 조회했는데,
 * 뒤로가기 시 직전에 보던 탭이 아니라 엉뚱한 탭으로 돌아가고(브라우저 히스토리 스택에
 * 쌓인 순서를 따라가므로), 동적 라우트 클라이언트 캐시(30초 staleTime) 때문에 탭을 눌러도
 * 반응이 없는 것처럼 보이는 경우가 있었다. 두 목록을 서버에서 한 번에 미리 가져와두고
 * 탭 전환은 화면 안에서만 처리해 두 문제를 모두 없앤다.
 */
export function RoomListTabs({
  rooms,
  myRooms,
  isLoggedIn,
  currentUserId,
  children,
}: RoomListTabsProps) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const showMine = tab === "mine";
  const activeRooms = showMine ? myRooms : rooms;

  return (
    <div className="space-y-4">
      {isLoggedIn && (
        <div className="flex gap-1 border-b">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              !showMine ? "border-brand text-brand" : "text-muted-foreground border-transparent"
            )}
          >
            전체 방
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              showMine ? "border-brand text-brand" : "text-muted-foreground border-transparent"
            )}
          >
            내가 참여중인 방
          </button>
        </div>
      )}

      {children}

      <div className="space-y-2.5">
        {activeRooms.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            {showMine
              ? "아직 참여 중인 방이 없어요."
              : "아직 개설된 방이 없어요. 첫 방을 만들어보세요!"}
          </p>
        ) : (
          activeRooms.map((room) => (
            <RoomCard key={room.id} room={room} currentUserId={currentUserId} />
          ))
        )}
      </div>
    </div>
  );
}
