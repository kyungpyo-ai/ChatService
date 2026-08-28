"use client";

import { useEffect } from "react";
import { updateRoomHeartbeatAction } from "@/app/actions/heartbeat";

const ROOM_HEARTBEAT_INTERVAL_MS = 60 * 1000;

/**
 * 방채팅 화면(`RoomChatView`)이 열려 있는 동안 `profiles.room_heartbeat_room_id`/
 * `room_heartbeat_at`을 주기적으로 갱신하는 훅. 같은 RPC가 `last_seen_at`/DAU 집계까지
 * 함께 처리하므로(§app/actions/heartbeat.ts, 2026-08-16) 방채팅 화면에서는 이 훅 하나로
 * 충분하고, 전역 하트비트(`useHeartbeat`)를 별도로 마운트하지 않는다.
 *
 * `lib/hooks/use-heartbeat.ts`(사이트 전역 접속자)와 동일하게 **탭 가시성과 무관하게**
 * mount 시 즉시 1회 + 이후 60초 간격으로 계속 보낸다 — 화면을 잠깐 끄거나 다른 앱을
 * 보고 있어도 방은 여전히 "대기 중"으로 유지돼야 자연스럽다(§실사용 피드백 2026-08-28,
 * "브라우저만 뒤로 가있을 뿐 실제로 대기하고 있는 건데 방이 사라진다"). 예전엔 탭이 안
 * 보이면 인터벌을 멈췄는데, 그러면 방채팅 목록 온라인 필터(60초 임계값)가 곧바로 그
 * 방을 숨겨버려서 전역 하트비트의 판단 근거와 어긋났다. 탭을 완전히 닫거나 네트워크가
 * 끊기면 하트비트가 더 안 오니 임계값 경과 후 자연스럽게 오프라인으로 수렴한다.
 */
export function useRoomHeartbeat(roomId: string) {
  useEffect(() => {
    void updateRoomHeartbeatAction(roomId);
    const intervalId = setInterval(() => {
      void updateRoomHeartbeatAction(roomId);
    }, ROOM_HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [roomId]);
}
