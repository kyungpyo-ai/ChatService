"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendDmNoteAction } from "@/app/actions/dm";
import { showError, showSuccess } from "@/lib/utils/toast";

interface DmComposeFormProps {
  recipientId: string;
  recipientNickname: string;
  recipientAvatarUrl: string | null;
}

/**
 * 새 쪽지 작성 화면 — 검색 결과/프로필 다이얼로그의 "쪽지 보내기" 진입점이 여기로 온다
 * (§ROADMAP Phase 11 재설계). "대화 시작"이 아니라 독립된 쪽지 한 통을 바로 작성해 보낸다.
 */
export function DmComposeForm({
  recipientId,
  recipientNickname,
  recipientAvatarUrl,
}: DmComposeFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSending(true);
    const result = await sendDmNoteAction(recipientId, trimmed);
    setSending(false);

    if (!result.success) {
      showError(result.message);
      return;
    }

    showSuccess("쪽지를 보냈습니다.");
    router.push("/dm");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={recipientAvatarUrl ?? undefined} alt={recipientNickname} />
          <AvatarFallback>{recipientNickname[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-muted-foreground text-xs">받는 사람</p>
          <p className="text-sm font-semibold">{recipientNickname}</p>
        </div>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`${recipientNickname}님에게 쪽지 보내기`}
        rows={8}
        disabled={sending}
        autoFocus
      />

      <Button
        className="bg-brand-gradient text-brand-foreground w-full gap-2 hover:brightness-105"
        onClick={() => void handleSend()}
        disabled={sending || !content.trim()}
      >
        <Send size={16} />
        {sending ? "보내는 중..." : "쪽지 보내기"}
      </Button>
    </div>
  );
}
