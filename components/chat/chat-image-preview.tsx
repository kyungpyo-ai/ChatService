"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatImagePreviewProps {
  /** 선택된 파일의 로컬 blob URL — next/image 최적화 대상이 아니므로 unoptimized로 렌더한다 */
  previewUrl: string;
  fileName: string;
  onCancel: () => void;
  disabled?: boolean;
}

/**
 * 이미지 전송 전 미리보기 — 입력창 위에 붙어 썸네일과 취소 버튼을 보여준다.
 * 실제 전송은 ChatInputBar의 전송 버튼으로 트리거되고, 이 컴포넌트는 업로드 전
 * 취소만 담당한다(업로드 시작 후에는 disabled로 취소를 막는다).
 */
export function ChatImagePreview({
  previewUrl,
  fileName,
  onCancel,
  disabled,
}: ChatImagePreviewProps) {
  return (
    <div className="bg-surface-muted flex items-center gap-3 border-b px-4 py-2">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-(--radius-bubble)">
        <Image src={previewUrl} alt={fileName} fill className="object-cover" unoptimized />
      </div>
      <p className="text-muted-foreground flex-1 truncate text-xs">{fileName}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="이미지 첨부 취소"
        className="shrink-0"
        onClick={onCancel}
        disabled={disabled}
      >
        <X size={16} />
      </Button>
    </div>
  );
}
