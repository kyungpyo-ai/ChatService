"use client";

import { useEffect, useState } from "react";

const RETRY_INTERVAL_MS = 1000;

/**
 * 같은 브라우저에서 동일한 key(랜덤채팅 세션 ID)를 가진 탭이 동시에 여러 개 열리는 것을
 * 막는다 — 먼저 연 탭이 리더가 되어 계속 쓰고, 나중에 연 탭(복사한 링크로 재입장, 탭 복제,
 * 브라우저 세션 복원 등)은 팔로워로 남아 리더 탭이 닫힐 때까지 대기한다(§실사용 요청,
 * 2026-08-16 — "세션을 복사해 들어가는 것"을 막고 싶다는 요구).
 *
 * Web Locks API(navigator.locks)를 사용한다 — 잠금을 쥔 탭이 닫히거나 크래시해도 브라우저가
 * 자동으로 해제해주므로, 직접 하트비트/타임스탬프로 "죽은 탭"을 판별하는 로직이 필요 없고
 * 여러 탭이 동시에 열려도 원자적으로 하나만 잠금을 얻는다는 게 보장된다.
 *
 * 미지원 브라우저(구형 Safari 등)에서는 기능을 그냥 꺼서(항상 리더) 기존 동작을 그대로
 * 유지한다 — 이 기능이 없다고 채팅 자체가 막히면 안 된다.
 */
export function useSingleTabLock(key: string): boolean | null {
  const [isLeader, setIsLeader] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("locks" in navigator)) {
      setIsLeader(true);
      return;
    }

    const lockName = `random-session-tab-lock:${key}`;
    let cancelled = false;
    let releaseLock: (() => void) | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const attempt = () => {
      if (cancelled) return;
      void navigator.locks.request(lockName, { ifAvailable: true }, (lock) => {
        if (cancelled) return undefined;

        if (!lock) {
          setIsLeader(false);
          retryTimer = setTimeout(attempt, RETRY_INTERVAL_MS);
          return undefined;
        }

        setIsLeader(true);
        // 탭이 살아있는 동안 잠금을 계속 쥐고 있어야 하므로, 언마운트 시점까지 resolve되지
        // 않는 프로미스를 반환한다.
        return new Promise<void>((resolve) => {
          releaseLock = resolve;
        });
      });
    };

    attempt();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      releaseLock?.();
    };
  }, [key]);

  return isLeader;
}
