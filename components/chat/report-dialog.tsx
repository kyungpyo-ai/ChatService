"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  createReportAction,
  type ReportReason,
  type ReportTargetType,
} from "@/app/actions/reports";

const REASON_OPTIONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "스팸/광고" },
  { value: "abuse", label: "욕설/혐오 발언" },
  { value: "illegal", label: "불법 콘텐츠" },
  { value: "other", label: "기타" },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
}

/**
 * 신고 사유 선택 다이얼로그 — components/rooms/report-button.tsx, components/random/report-button.tsx
 * 가 공유하는 실제 UI(§DEVELOPMENT_PLAN 7.5.4). ChatHeader의 "더보기" 드롭다운 메뉴 아이템이
 * open 상태를 제어하므로, 이 컴포넌트 자체는 트리거 버튼을 갖지 않는 controlled dialog다 —
 * Radix DropdownMenu 안에 Dialog 트리거를 직접 중첩하면 드롭다운이 닫히면서 다이얼로그도
 * 함께 닫혀버리는 문제가 있어, 부모(ChatHeader 사용처)가 상태를 소유하고 이 컴포넌트는
 * Portal로 독립적으로 렌더링되는 Dialog만 담당하도록 분리했다.
 */
export function ReportDialog({ open, onOpenChange, targetType, targetId }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createReportAction(targetType, targetId, reason, detail || undefined);
      if (!result.success) {
        showError(result.message);
        return;
      }
      showInfo(result.message);
      setDetail("");
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>신고하기</DialogTitle>
          <DialogDescription>
            신고 내용은 운영팀이 검토합니다. 허위 신고는 서비스 이용에 제한이 있을 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Select value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REASON_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            placeholder="상세 내용 (선택)"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={isPending}>
            신고 접수
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
