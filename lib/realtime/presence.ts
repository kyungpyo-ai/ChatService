"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { claimJoinSignal, isRoomNotificationsEnabled, notifyIfTabHidden } from "@/lib/utils/notify";

// 구독 직후 한동안(연결 수립 + 초기 상태 동기화 시간) 도착하는 join은 "이미 있던 사람"이
// 뒤늦게 보고되는 것일 뿐, 진짜 새로 온라인이 된 게 아니다 — sync 이벤트 하나만으로 구분하려
// 했더니 sync가 빈 상태로 먼저 오고 이미 있던 사람의 join이 그 뒤에 도착하는 레이스가
// 있어(§실사용 확인 2026-08-24, 입장 후 1초쯤 뒤에 알림음이 오탐), 아예 마운트 후 일정
// 시간 동안의 join은 시간 기준으로 걸러낸다.
const PRESENCE_SETTLE_GRACE_MS = 2000;

// Presence(웹소켓)만으로는 실사용 환경에서 접속 중인데도 오프라인으로 잘못 뜨는 경우가
// 있다(§CLAUDE.md 실사용 함정 — Presence 하트비트가 25초라 기대만큼 안 빠름, 모바일 신호 유실 등).
// 방 목록(getRoomList)이 쓰는 것과 같은 last_seen_at 폴링을 보조 신호로 함께 반영해
// Presence가 끊겨도 실제로 접속 중이면 온라인으로 보이게 한다.
const HEARTBEAT_ONLINE_THRESHOLD_MS = 60 * 1000;
const HEARTBEAT_POLL_INTERVAL_MS = 20 * 1000;

/**
 * 참가자들의 last_seen_at을 주기적으로 폴링해 온라인 여부를 보조로 판정한다.
 * Presence와 별개의 신호이므로 호출 쪽에서 두 Set을 합쳐서 사용한다.
 */
export function useParticipantsHeartbeatOnline(participantIds: string[]): Set<string> {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const idsKey = [...participantIds].sort().join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    const supabase = createClient();
    let cancelled = false;

    const poll = async () => {
      if (ids.length === 0) {
        if (!cancelled) setOnlineIds(new Set());
        return;
      }
      const { data } = await supabase.from("profiles").select("id, last_seen_at").in("id", ids);
      if (cancelled || !data) return;
      const threshold = Date.now() - HEARTBEAT_ONLINE_THRESHOLD_MS;
      setOnlineIds(
        new Set(
          data
            .filter((p) => p.last_seen_at && new Date(p.last_seen_at).getTime() > threshold)
            .map((p) => p.id)
        )
      );
    };

    void poll();
    const interval = ids.length === 0 ? null : setInterval(poll, HEARTBEAT_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [idsKey]);

  return onlineIds;
}

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
        // room_members INSERT(§lib/realtime/messages.ts)와 한 쌍의 신호다 — claimJoinSignal이
        // 이 쌍의 첫 신호일 때만 true를 돌려주므로, 이미 그쪽에서 울렸으면 여기선 건너뛴다.
        if (
          isRoomNotificationsEnabled(roomId) &&
          claimJoinSignal(`room-join:${roomId}:${key}`, "presence")
        ) {
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
