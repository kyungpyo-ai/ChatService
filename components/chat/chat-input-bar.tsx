"use client";

import { Plus, Smile, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * 채팅 하단 고정 입력창 — Phase 2에서는 UI만, 실제 전송 로직은 Phase 3/5에서 연결
 */
export function ChatInputBar() {
  return (
    <div className="bg-surface sticky bottom-0 flex items-center gap-2 border-t p-3">
      <Button variant="ghost" size="icon" aria-label="이미지 첨부" className="shrink-0">
        <Plus size={20} />
      </Button>

      <Input placeholder="메시지를 입력하세요" className="rounded-full" />

      <Button variant="ghost" size="icon" aria-label="이모지" className="shrink-0">
        <Smile size={20} />
      </Button>

      <Button
        size="icon"
        className="bg-brand hover:bg-brand/90 text-brand-foreground shrink-0 rounded-full md:h-9 md:w-auto md:gap-1.5 md:px-4"
        aria-label="전송"
      >
        <Send size={16} />
        <span className="hidden text-sm font-medium md:inline">전송</span>
      </Button>
    </div>
  );
}
