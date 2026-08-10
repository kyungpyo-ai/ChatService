"use client";

import { ActionReasonDialog } from "@/components/admin/action-reason-dialog";
import { forceDeleteRoomAction } from "@/app/actions/admin";

export function ForceDeleteRoomButton({ roomId }: { roomId: string }) {
  return (
    <ActionReasonDialog
      triggerLabel="강제 삭제"
      title="방을 강제 삭제하시겠습니까?"
      description="삭제된 방은 즉시 종료되며, 대화 내용은 아카이브에 자동 보존됩니다."
      confirmLabel="삭제"
      redirectTo="/admin/rooms"
      action={(reason) => forceDeleteRoomAction(roomId, reason)}
    />
  );
}
