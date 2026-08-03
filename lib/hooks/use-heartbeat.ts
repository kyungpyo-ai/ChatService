"use client";

import { useEffect } from "react";
import { updateLastSeenAction } from "@/app/actions/heartbeat";

const HEARTBEAT_INTERVAL_MS = 60 * 1000;

/**
 * 로그인 사용자의 온라인 상태(`profiles.last_seen_at`)를 주기적으로 갱신하는 훅.
 *
 * - mount 시 즉시 1회 호출
 * - 탭이 보이는(`visible`) 동안에만 60초 간격으로 재호출
 * - 탭이 백그라운드로 가면 인터벌을 정지하고, 다시 보이면 즉시 1회 갱신 후 재시작
 *   (불필요한 백그라운드 탭 갱신을 방지)
 */
export function useHeartbeat() {
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(() => {
        void updateLastSeenAction();
      }, HEARTBEAT_INTERVAL_MS);
    };

    const stopInterval = () => {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void updateLastSeenAction();
        startInterval();
      } else {
        stopInterval();
      }
    };

    // mount 시 즉시 1회 갱신
    void updateLastSeenAction();
    if (document.visibilityState === "visible") {
      startInterval();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopInterval();
    };
  }, []);
}
