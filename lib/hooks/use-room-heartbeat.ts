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
 * `lib/hooks/use-heartbeat.ts`(사이트 전역 접속자, 60초 주기/2분 신선도)와 동일한 패턴을
 * 재사용한다 — 방채팅 화면은 랜덤채팅 대기 화면처럼 촘촘한 주기(5초 폴링/15초 신선도)가
 * 필요할 만큼 짧게 열렸다 닫히지 않고, 사이트 전역 접속자와 마찬가지로 오래 열어두는
 * 특성이 있어 기존 컨벤션을 그대로 따르는 편이 일관적이다(§20260813000000).
 *
 * - mount 시(및 roomId가 바뀔 때) 즉시 1회 호출
 * - 탭이 보이는 동안에만 60초 간격으로 재호출
 * - 언마운트 시 인터벌만 멈추고 DB 값은 지우지 않는다 — 네트워크 순단/탭 강제종료 시
 *   언마운트 이벤트가 안 터지는 문제를 랜덤채팅에서 이미 겪었다(§20260805010000). 신선도
 *   윈도우(2분)로 자연 만료시키는 방식을 그대로 따른다.
 */
export function useRoomHeartbeat(roomId: string) {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        void updateRoomHeartbeatAction(roomId);
      }, ROOM_HEARTBEAT_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void updateRoomHeartbeatAction(roomId);
        startInterval();
      } else {
        stopInterval();
      }
    };

    void updateRoomHeartbeatAction(roomId);
    if (document.visibilityState === "visible") {
      startInterval();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopInterval();
    };
  }, [roomId]);
}
