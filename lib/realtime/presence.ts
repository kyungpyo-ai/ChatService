"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isRoomNotificationsEnabled, notifyIfTabHidden } from "@/lib/utils/notify";

/**
 * 방채팅 온라인 상태 구독 (Realtime Presence)
 *
 * room_members(멤버십, 영구)와 별개로 "지금 이 방 화면을 열어둔 사람"만 추적한다.
 * 새로고침/네트워크 순단에도 멤버십이 사라지지 않도록 하기 위해 멤버십과는 분리된 개념으로 둔다.
 */
export function useRoomPresence(roomId: string, userId: string): Set<string> {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  // 구독 직후 첫 sync는 "이미 온라인이던 사람들"의 초기 목록일 뿐이라 알림 대상이 아니다.
  // 첫 sync 이후에 도착하는 join만 "누군가 새로 온라인이 됨"으로 보고 알림음을 울린다.
  const hasSyncedOnceRef = useRef(false);

  useEffect(() => {
    hasSyncedOnceRef.current = false;

    const supabase = createClient();
    const channel = supabase.channel(`room-${roomId}-presence`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineUserIds(new Set(Object.keys(channel.presenceState())));
        hasSyncedOnceRef.current = true;
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === userId || !hasSyncedOnceRef.current) return;
        if (isRoomNotificationsEnabled(roomId)) {
          notifyIfTabHidden();
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId]);

  return onlineUserIds;
}
