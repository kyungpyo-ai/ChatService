"use client";

import { ActionReasonDialog } from "@/components/admin/action-reason-dialog";
import { forceEndRandomSessionAction } from "@/app/actions/admin";

export function ForceEndRandomSessionButton({ sessionId }: { sessionId: string }) {
  return (
    <ActionReasonDialog
      triggerLabel="세션 강제 종료"
      title="랜덤채팅 세션을 강제 종료하시겠습니까?"
      description="종료된 세션은 잠시 후 자동으로 아카이브됩니다."
      confirmLabel="종료"
      redirectTo="/admin/random"
      action={(reason) => forceEndRandomSessionAction(sessionId, reason)}
    />
  );
}
