"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

/**
 * 전역 에러 바운더리 — 서버 컴포넌트/데이터 조회 중 예외가 나면 Next.js 기본(비브랜딩)
 * 에러 화면 대신 이 화면을 보여준다(§ROADMAP Phase 8). 라우트별로 세분화하지 않고 앱
 * 전체에 하나만 둔다.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <EmptyState
        icon={AlertTriangle}
        title="문제가 발생했습니다"
        description="일시적인 오류일 수 있어요. 다시 시도하거나 홈으로 돌아가 주세요."
        action={
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={reset}>
              다시 시도
            </Button>
            <Link href="/">
              <Button className="bg-brand-gradient text-brand-foreground hover:brightness-105">
                홈으로
              </Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
