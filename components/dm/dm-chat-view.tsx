"use client";

import { useEffect, useRef } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessageBubble, type ChatMessage } from "@/components/chat/chat-message-bubble";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { useDmMessages } from "@/lib/realtime/dm";
import { formatChatDate, isSameLocalDate } from "@/lib/utils/date";

interface DmChatViewProps {
  conversationId: string;
  partnerId: string;
  partnerNickname: string;
  partnerAvatarUrl: string | null;
  initialMessages: ChatMessage[];
  currentUserId: string;
}

/**
 * 쪽지(DM) 대화 화면 — RoomChatView와 동일한 헤더/버블/입력창 조합을 재사용하되, 참여자가
 * 항상 둘뿐이라 참여자 패널·강퇴·방 삭제 안내가 없는 단순한 형태다(§ROADMAP Phase 11).
 * 이미지 전송은 1차 버전 범위 밖이라 ChatInputBar에 onSendImage를 넘기지 않는다(첨부 버튼 비활성화).
 */
export function DmChatView({
  conversationId,
  partnerId,
  partnerNickname,
  partnerAvatarUrl,
  initialMessages,
  currentUserId,
}: DmChatViewProps) {
  const { messages, hasMoreHistory, loadingOlderMessages, loadOlderMessages, sendMessage } =
    useDmMessages(conversationId, initialMessages, currentUserId, {
      id: partnerId,
      nickname: partnerNickname,
      avatarUrl: partnerAvatarUrl,
    });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // 방채팅과 동일하게 마지막 메시지 id가 실제로 바뀐 경우(=새 메시지가 뒤에 추가된 경우)에만
  // 맨 아래로 스크롤한다("이전 대화 더 보기"로 앞에 붙는 경우는 제외).
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const lastId = messages[messages.length - 1]?.id ?? null;
    if (lastId === lastMessageIdRef.current) return;
    lastMessageIdRef.current = lastId;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el || loadingOlderMessages || !hasMoreHistory) return;
    if (el.scrollTop > 80) return;

    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;
    void loadOlderMessages().then(() => {
      requestAnimationFrame(() => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight - prevScrollHeight + prevScrollTop;
      });
    });
  };

  return (
    <div className="flex h-dvh flex-col">
      <ChatHeader title={partnerNickname} backHref="/dm" />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
      >
        {loadingOlderMessages && (
          <p className="text-muted-foreground py-1 text-center text-xs">이전 대화 불러오는 중...</p>
        )}
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showDateDivider =
            !prevMessage || !isSameLocalDate(prevMessage.createdAt, message.createdAt);

          return (
            <div key={message.id}>
              {showDateDivider && (
                <div className="mb-4 flex justify-center py-1">
                  <span
                    className="bg-surface-muted text-muted-foreground rounded-full px-3 py-1 text-xs"
                    suppressHydrationWarning
                  >
                    {formatChatDate(message.createdAt)}
                  </span>
                </div>
              )}
              <ChatMessageBubble
                message={message}
                variant={message.senderId === currentUserId ? "me" : "other"}
              />
            </div>
          );
        })}
      </div>

      <ChatInputBar onSend={(text) => void sendMessage(text)} />
    </div>
  );
}
