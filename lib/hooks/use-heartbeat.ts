"use client";

import { useEffect } from "react";
import { updateLastSeenAction } from "@/app/actions/heartbeat";

const HEARTBEAT_INTERVAL_MS = 60 * 1000;

/**
 * 로그인 사용자의 온라인 상태(`profiles.last_seen_at`)를 주기적으로 갱신하는 훅.
 *
 * 탭 가시성(visibilitychange)과 무관하게 mount 시 즉시 1회 + 이후 60초 간격으로 계속
 * 갱신한다 — 탭을 열어두고 다른 창을 보고 있어도 온라인으로 유지되어야 자연스럽다는
 * 판단(§방채팅 목록 온라인 필터링). 탭을 완전히 닫거나(모바일에서 앱을 백그라운드로 보내
 * OS가 JS 실행을 정지시키는 경우 포함) 네트워크가 끊기면 하트비트가 더 이상 오지 않아
 * 임계값 경과 후 자연스럽게 오프라인으로 수렴하므로, 그 경우를 위한 별도 처리는 불필요하다.
 */
export function useHeartbeat() {
  useEffect(() => {
    void updateLastSeenAction();
    const intervalId = setInterval(() => {
      void updateLastSeenAction();
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
}
