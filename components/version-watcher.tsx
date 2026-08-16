"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

// 대화 중에는 절대 새로고침을 강요하지 않는다 — 방채팅/랜덤채팅 상세 화면에서만 억제하고,
// 방 목록/매칭 대기 화면 등 나머지 화면에서는 배너를 띄운다.
function isActiveChatPath(pathname: string): boolean {
  return /^\/rooms\/(?!new$)[^/]+/.test(pathname) || /^\/random\/[^/]+/.test(pathname);
}

interface VersionWatcherProps {
  initialVersion: string;
}

/**
 * 배포 중 열려있던 탭이 구버전 클라이언트를 계속 실행하는 버전 스큐를 감지한다.
 *
 * 새로고침을 강제하지 않고, 대화 화면이 아닐 때만 닫히지 않는 배너로 새로고침을 유도한다
 * (§ROADMAP Phase 9 "버전 스큐 처리 관련 메모").
 */
export function VersionWatcher({ initialVersion }: VersionWatcherProps) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const notifiedRef = useRef(false);
  pathnameRef.current = pathname;

  useEffect(() => {
    const checkVersion = async () => {
      if (notifiedRef.current) return;

      try {
        const res = await fetch("/api/build-version", { cache: "no-store" });
        const { version } = (await res.json()) as { version: string };

        if (version !== initialVersion && !isActiveChatPath(pathnameRef.current)) {
          notifiedRef.current = true;
          toast("새 버전이 있습니다", {
            description: "새로고침하면 최신 버전을 사용할 수 있어요.",
            duration: Infinity,
            action: {
              label: "새로고침",
              onClick: () => window.location.reload(),
            },
          });
        }
      } catch {
        // 네트워크 오류 시 다음 폴링에서 재시도 — 별도 처리 불필요
      }
    };

    const interval = setInterval(checkVersion, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [initialVersion]);

  return null;
}
