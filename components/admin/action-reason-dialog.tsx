"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { showError, showInfo } from "@/lib/utils/toast";
import type { ActionResult } from "@/lib/types/forms";

interface ActionReasonDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel?: string;
  action: (reason: string) => Promise<ActionResult>;
  /** 성공 시 이동할 경로 — 미지정 시 현재 화면을 새로고침만 한다 */
  redirectTo?: string;
}

/**
 * 사유 입력 + 확인 다이얼로그 — 방 강제 삭제/세션 강제 종료 등 관리자 조치 공통 사용
 * (§DEVELOPMENT_PLAN 7.5.4 "ConfirmDialog + 사유 입력").
 */
export function ActionReasonDialog({
  triggerLabel,
  title,
  description,
  confirmLabel = "확인",
  action,
  redirectTo,
}: ActionReasonDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await action(reason);
      if (!result.success) {
        showError(result.message);
        return;
      }
      showInfo(result.message || "처리되었습니다.");
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="조치 사유를 입력하세요"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
