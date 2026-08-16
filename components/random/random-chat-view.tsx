"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessageBubble, type ChatMessage } from "@/components/chat/chat-message-bubble";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { Button } from "@/components/ui/button";
import { RandomReportButton } from "@/components/random/report-button";
import { useRandomSessionMessages } from "@/lib/realtime/random";
import { endRandomSessionAction } from "@/app/actions/random";
import { showError, showInfo } from "@/lib/utils/toast";

interface RandomChatViewProps {
  sessionId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  initialEnded: boolean;
  initialEndedByMe: boolean;
}

/**
 * 랜덤채팅 화면 — useRandomSessionMessages로 실시간 메시지·상대방 종료를 감지한다.
 * 대화가 끝나면(본인 종료 또는 상대방 종료) 입력창 대신 재매칭/홈으로 버튼을 노출한다(RND-05).
 */
export function RandomChatView({
  sessionId,
  initialMessages,
  currentUserId,
  initialEnded,
  initialEndedByMe,
}: RandomChatViewProps) {
  const router = useRouter();
  const [endedByMe, setEndedByMe] = useState(initialEndedByMe);
  const [reportOpen, setReportOpen] = useState(false);
  const { messages, partnerEnded, sendMessage, sendImageMessage } = useRandomSessionMessages(
    sessionId,
    initialMessages,
    currentUserId
  );

  const sessionEnded = initialEnded || endedByMe || partnerEnded;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (partnerEnded) {
      showInfo("상대방이 대화를 종료했습니다.");
    }
  }, [partnerEnded]);

  // 초기 로딩 시 + 새 메시지가 올 때마다 + 대화 종료 시 스크롤을 맨 아래로 이동한다.
  // scrollIntoView는 컨테이너의 하단 padding까지는 못 밀어줘서 스크롤이 진짜 끝까지 안 간 것처럼
  // 보이는 문제가 있어, 컨테이너의 scrollTop을 scrollHeight로 직접 맞춘다.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sessionEnded]);

  const handleSend = (text: string) => {
    if (sessionEnded) return;
    void sendMessage(text);
  };

  const handleSendImage = async (file: File) => {
    if (sessionEnded) return;
    await sendImageMessage(file);
  };

  const handleEnd = async () => {
    const result = await endRandomSessionAction(sessionId);
    if (!result.success) {
      showError(result.message);
      return;
    }
    setEndedByMe(true);
  };

  const handleRematch = async () => {
    // 재매칭 전에 세션을 확실히 종료 처리한다 — 이미 종료된 세션이면 end_random_session()이
    // status = 'active' 조건으로 조용히 무시하므로 중복 호출해도 안전하다(§5.3).
    await endRandomSessionAction(sessionId);
    router.push("/random");
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <ChatHeader
        title="익명과의 대화"
        backHref="/"
        onLeave={sessionEnded ? undefined : () => void handleEnd()}
        leaveLabel="종료"
        onReport={() => setReportOpen(true)}
      />

      {sessionEnded && (
        <div className="bg-destructive/10 text-destructive flex items-center justify-center gap-1.5 px-4 py-2.5 text-center text-sm font-semibold">
          대화가 종료되었습니다
        </div>
      )}

      <div ref={scrollContainerRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            variant={message.senderId === currentUserId ? "me" : "other"}
          />
        ))}
        {sessionEnded && (
          <ChatMessageBubble
            message={{
              id: "session-ended-notice",
              senderId: "system",
              senderName: "system",
              content: partnerEnded ? "상대방이 대화를 종료했습니다." : "대화를 종료했습니다.",
              createdAt: new Date().toISOString(),
              isSystemNotice: true,
            }}
            variant="other"
          />
        )}
      </div>

      {sessionEnded ? (
        <div className="bg-surface sticky bottom-0 border-t p-3">
          <Button
            className="bg-brand hover:bg-brand/90 text-brand-foreground w-full"
            onClick={handleRematch}
          >
            재매칭
          </Button>
        </div>
      ) : (
        <ChatInputBar onSend={handleSend} onSendImage={handleSendImage} />
      )}
      <RandomReportButton sessionId={sessionId} open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
