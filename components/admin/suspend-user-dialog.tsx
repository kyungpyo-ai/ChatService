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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showError, showInfo } from "@/lib/utils/toast";
import { suspendUserAction } from "@/app/actions/admin";

const DURATION_OPTIONS = [
  { value: "1", label: "1일" },
  { value: "7", label: "7일" },
  { value: "30", label: "30일" },
  { value: "permanent", label: "영구" },
] as const;

function computeUntil(durationDays: string): string | null {
  if (durationDays === "permanent") return null;
  const until = new Date();
  until.setDate(until.getDate() + Number(durationDays));
  return until.toISOString();
}

/** 정지 사유 + 기간(select: 1일/7일/30일/영구) 입력 다이얼로그(§DEVELOPMENT_PLAN 7.5.4). */
export function SuspendUserDialog({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<string>("7");
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await suspendUserAction(userId, reason, computeUntil(duration));
      if (!result.success) {
        showError(result.message);
        return;
      }
      showInfo(result.message);
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">계정 정지</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>계정을 정지하시겠습니까?</DialogTitle>
          <DialogDescription>
            정지된 계정은 로그인은 가능하지만 방 입장/매칭/메시지 전송/이미지 업로드가 거부됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue placeholder="정지 기간" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="정지 사유를 입력하세요"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            정지
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
