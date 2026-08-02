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

interface LeaveRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isOwner: boolean;
}

/**
 * 방 나가기 확인 다이얼로그 — 방장이 나가면 방 자체가 삭제되므로 문구를 다르게 안내한다.
 */
export function LeaveRoomDialog({ open, onOpenChange, onConfirm, isOwner }: LeaveRoomDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>방을 나가시겠어요?</DialogTitle>
          <DialogDescription>
            {isOwner
              ? "방장이 나가면 이 방은 삭제되고 모든 대화 내용이 사라집니다."
              : "다시 입장하려면 목록에서 이 방을 찾아 새로 입장해야 합니다."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            나가기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
