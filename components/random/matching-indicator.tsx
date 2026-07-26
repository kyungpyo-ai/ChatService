"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * 매칭 대기 펄스 애니메이션 + 경과 시간 타이머 + 평균 매칭 시간 안내
 */
export function MatchingIndicator() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="space-y-1 text-center">
        <p className="text-lg font-semibold">대화 상대를 찾고 있어요...</p>
        <p className="text-muted-foreground text-sm">잠시만 기다려주세요 😊</p>
      </div>

      <div className="relative flex h-40 w-40 items-center justify-center">
        <span className="bg-brand/20 absolute inset-0 animate-ping rounded-full" />
        <span className="bg-brand/10 absolute inset-3 animate-pulse rounded-full" />
        <div className="bg-brand text-brand-foreground relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg">
          <MessageCircle size={32} />
        </div>
      </div>

      <div className="space-y-1 text-center">
        <p className="text-2xl font-bold tabular-nums">{formatElapsed(elapsed)}</p>
        <p className="text-muted-foreground text-xs">평균 매칭 시간 약 30초</p>
      </div>
    </div>
  );
}
