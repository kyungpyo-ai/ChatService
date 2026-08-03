"use client";

import { useHeartbeat } from "@/lib/hooks/use-heartbeat";

interface HeartbeatProviderProps {
  userId: string | null;
}

/**
 * 로그인 사용자의 온라인 상태를 유지하기 위한 UI 없는 로직 전용 wrapper.
 * `userId`가 있을 때만 하트비트 훅을 활성화한다.
 */
export function HeartbeatProvider({ userId }: HeartbeatProviderProps) {
  return userId ? <HeartbeatRunner /> : null;
}

function HeartbeatRunner() {
  useHeartbeat();
  return null;
}
