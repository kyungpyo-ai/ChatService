"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isRoomNotificationsEnabled, notifyIfTabHidden } from "@/lib/utils/notify";

// 구독 직후 한동안(연결 수립 + 초기 상태 동기화 시간) 도착하는 join은 "이미 있던 사람"이
// 뒤늦게 보고되는 것일 뿐, 진짜 새로 온라인이 된 게 아니다 — sync 이벤트 하나만으로 구분하려
// 했더니 sync가 빈 상태로 먼저 오고 이미 있던 사람의 join이 그 뒤에 도착하는 레이스가
// 있어(§실사용 확인 2026-08-24, 입장 후 1초쯤 뒤에 알림음이 오탐), 아예 마운트 후 일정
// 시간 동안의 join은 시간 기준으로 걸러낸다.
const PRESENCE_SETTLE_GRACE_MS = 2000;

/**
 * 방채팅 온라인 상태 구독 (Realtime Presence)
 *
 * room_members(멤버십, 영구)와 별개로 "지금 이 방 화면을 열어둔 사람"만 추적한다.
 * 새로고침/네트워크 순단에도 멤버십이 사라지지 않도록 하기 위해 멤버십과는 분리된 개념으로 둔다.
 */
export function useRoomPresence(roomId: string, userId: string): Set<string> {
  // 본인은 이 화면을 렌더링하고 있는 시점에 이미 사실상 온라인이므로, 서버 왕복(채널 연결 +
  // track() 브로드캐스트)을 기다리지 않고 마운트 즉시 온라인으로 낙관적 반영한다
  // (§실사용 피드백 2026-08-24 — "방 접속하면 바로 온라인이어야 하는거 아니냐").
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(() => new Set([userId]));
  const mountedAtRef = useRef(0);

  useEffect(() => {
    mountedAtRef.current = Date.now();

    const supabase = createClient();
    const channel = supabase.channel(`room-${roomId}-presence`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setOnlineUserIds(new Set(Object.keys(channel.presenceState())));
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key === userId) return;
        if (Date.now() - mountedAtRef.current < PRESENCE_SETTLE_GRACE_MS) return;
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
