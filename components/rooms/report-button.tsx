"use client";

import { ReportDialog } from "@/components/chat/report-dialog";

interface RoomReportButtonProps {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 방채팅 신고 진입점 — ChatHeader의 "더보기" 메뉴에서 open 상태를 제어한다
 * (§DEVELOPMENT_PLAN 7.5.4, components/rooms/room-chat-view.tsx가 상태를 소유).
 */
export function RoomReportButton({ roomId, open, onOpenChange }: RoomReportButtonProps) {
  return (
    <ReportDialog open={open} onOpenChange={onOpenChange} targetType="room" targetId={roomId} />
  );
}
