"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EndSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * 랜덤채팅 종료 확인 다이얼로그 — 방 나가기(LeaveRoomDialog)와 동일한 패턴.
 * 종료하면 이 대화로 다시 돌아올 수 없으므로 실수로 끝내는 것을 막는다.
 */
export function EndSessionDialog({ open, onOpenChange, onConfirm }: EndSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>대화를 종료하시겠어요?</DialogTitle>
          <DialogDescription>종료하면 이 대화는 다시 이어갈 수 없습니다.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            종료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
