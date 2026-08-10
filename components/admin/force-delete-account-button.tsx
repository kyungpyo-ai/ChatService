"use client";

import { ActionReasonDialog } from "@/components/admin/action-reason-dialog";
import { forceDeleteAccountAction } from "@/app/actions/admin";

export function ForceDeleteAccountButton({ userId }: { userId: string }) {
  return (
    <ActionReasonDialog
      triggerLabel="강제 탈퇴"
      title="계정을 강제 탈퇴시키겠습니까?"
      description="탈퇴 처리는 되돌릴 수 없습니다. 소유한 방/대화는 자동으로 아카이브된 뒤 삭제됩니다."
      confirmLabel="탈퇴"
      redirectTo="/admin/users"
      action={(reason) => forceDeleteAccountAction(userId, reason)}
    />
  );
}
