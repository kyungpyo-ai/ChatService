"use client";

import { useState } from "react";
import { Plus, Smile, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputBarProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

/**
 * 채팅 하단 고정 입력창 — 텍스트 전송만 처리(이미지 첨부 버튼은 Phase 6에서 연결)
 *
 * disabled가 true면(예: 방이 삭제된 경우) 입력/전송을 모두 막는다.
 */
export function ChatInputBar({ onSend, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div className="bg-surface sticky bottom-0 flex items-center gap-2 border-t p-3">
      <Button variant="ghost" size="icon" aria-label="이미지 첨부" className="shrink-0" disabled>
        <Plus size={20} />
      </Button>

      <Input
        placeholder="메시지를 입력하세요"
        className="rounded-full"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <Button variant="ghost" size="icon" aria-label="이모지" className="shrink-0" disabled>
        <Smile size={20} />
      </Button>

      <Button
        size="icon"
        className="bg-brand hover:bg-brand/90 text-brand-foreground shrink-0 rounded-full md:h-9 md:w-auto md:gap-1.5 md:px-4"
        aria-label="전송"
        onClick={handleSend}
        disabled={disabled}
      >
        <Send size={16} />
        <span className="hidden text-sm font-medium md:inline">전송</span>
      </Button>
    </div>
  );
}
