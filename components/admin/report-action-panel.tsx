"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { showError, showInfo } from "@/lib/utils/toast";
import { resolveReportAction, dismissReportAction } from "@/app/actions/admin";

/**
 * 신고 상세의 처리/기각 폼(§DEVELOPMENT_PLAN 7.5.4). 조치(강제 삭제·정지)는 관리자가
 * 신고 상세 화면에서 먼저 별도 버튼(방/세션/회원 상세 링크)으로 실행한 뒤, 이 패널로 신고
 * 자체를 "처리 완료"/"기각"으로 닫는 2단계 흐름이다(§7.5.5 — 오탐 신고로 즉시 삭제되는 사고 방지).
 */
export function ReportActionPanel({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [actionTaken, setActionTaken] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleResolve = () => {
    startTransition(async () => {
      const result = await resolveReportAction(reportId, actionTaken);
      if (!result.success) {
        showError(result.message);
        return;
      }
      showInfo(result.message);
      router.refresh();
    });
  };

  const handleDismiss = () => {
    startTransition(async () => {
      const result = await dismissReportAction(reportId);
      if (!result.success) {
        showError(result.message);
        return;
      }
      showInfo(result.message);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="조치 내용을 입력하세요 (예: 방 강제 삭제, 계정 7일 정지)"
        value={actionTaken}
        onChange={(e) => setActionTaken(e.target.value)}
      />
      <div className="flex gap-2">
        <Button onClick={handleResolve} disabled={isPending}>
          처리 완료
        </Button>
        <Button variant="outline" onClick={handleDismiss} disabled={isPending}>
          기각
        </Button>
      </div>
    </div>
  );
}
