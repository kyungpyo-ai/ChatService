"use client";

import { ReportDialog } from "@/components/chat/report-dialog";

interface RandomReportButtonProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 랜덤채팅 신고 진입점 — ChatHeader의 "더보기" 메뉴에서 open 상태를 제어한다
 * (§DEVELOPMENT_PLAN 7.5.4, components/random/random-chat-view.tsx가 상태를 소유). 게스트도
 * 신고할 수 있어야 하므로 createReportAction의 authenticated(익명 세션 포함) 전제를 그대로 쓴다.
 */
export function RandomReportButton({ sessionId, open, onOpenChange }: RandomReportButtonProps) {
  return (
    <ReportDialog
      open={open}
      onOpenChange={onOpenChange}
      targetType="random_session"
      targetId={sessionId}
    />
  );
}
