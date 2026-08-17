"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadOlderDmMessagesAction, sendDmMessageAction } from "@/app/actions/dm";
import { showError } from "@/lib/utils/toast";
import { generateTempId } from "@/lib/utils/temp-id";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";

// lib/queries/dm.ts의 DM_MESSAGES_PAGE_SIZE와 같은 값을 별도로 둔다 — 그 파일은 next/headers를
// 쓰는 서버 전용 lib/supabase/server.ts를 값으로 import하고 있어, 여기서 값(런타임) import로
// 가져오면 서버 전용 코드가 클라이언트 번들에 섞여 들어가 깨진다(§lib/realtime/messages.ts와 동일 이유).
const DM_MESSAGES_PAGE_SIZE = 50;

/**
 * 서버 액션이 sessionExpired를 반환하면(§lib/utils/stale-session.ts) 이미 삭제된 계정의
 * 세션이라는 뜻이다 — 클라이언트에서도 로그아웃 처리하고 잠시 후 새로고침해 새 세션을 받도록 유도한다.
 */
async function recoverFromStaleSession(message: string) {
  showError(message);
  const supabase = createClient();
  await supabase.auth.signOut();
  window.setTimeout(() => window.location.reload(), 1500);
}

interface MessageRow {
  id: string;
  sender_id: string;
  content_type: string;
  content: string;
  created_at: string;
}

/** 전송 직후 낙관적으로 붙인 메시지를 Realtime INSERT 이벤트와 매칭하기 위한 대기 큐 항목 */
interface PendingSend {
  tempId: string;
  content: string;
}

interface DmPartner {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

interface DmLiveState {
  messages: ChatMessage[];
  hasMoreHistory: boolean;
  loadingOlderMessages: boolean;
  loadOlderMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

/**
 * 쪽지(DM) 실시간 상태 — 방채팅(lib/realtime/messages.ts)의 낙관적 전송 + Realtime INSERT
 * reconcile 패턴을 그대로 재사용한다. 참여자가 항상 둘뿐이고 강퇴·방 삭제 개념이 없어
 * 참여자 변경 채널이나 kicked/roomDeleted 같은 상태는 없다 — 메시지 채널 하나만 구독한다.
 */
export function useDmMessages(
  conversationId: string,
  initialMessages: ChatMessage[],
  currentUserId: string,
  partner: DmPartner
): DmLiveState {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [hasMoreHistory, setHasMoreHistory] = useState(
    initialMessages.length >= DM_MESSAGES_PAGE_SIZE
  );
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const pendingSendsRef = useRef<PendingSend[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Realtime 채널은 기본적으로 anon 권한으로 연결되므로, RLS가 auth.uid()를 참조하는
    // 이벤트를 받으려면 로그인 세션의 access token을 명시적으로 realtime 클라이언트에 전달해야 한다.
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`dm-${conversationId}-messages`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `dm_conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const row = payload.new as MessageRow;
            const isMine = row.sender_id === currentUserId;

            if (isMine) {
              const pendingIndex = pendingSendsRef.current.findIndex(
                (p) => p.content === row.content
              );
              if (pendingIndex !== -1) {
                const [pending] = pendingSendsRef.current.splice(pendingIndex, 1);
                setMessages((prev) => {
                  if (prev.some((m) => m.id === row.id)) return prev;
                  return prev.map((m) =>
                    m.id === pending.tempId
                      ? {
                          id: row.id,
                          senderId: row.sender_id,
                          senderName: "나",
                          content: row.content,
                          createdAt: row.created_at,
                        }
                      : m
                  );
                });
                return;
              }
            }

            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [
                ...prev,
                {
                  id: row.id,
                  senderId: row.sender_id,
                  senderName: isMine ? "나" : partner.nickname,
                  senderAvatarUrl: isMine ? null : partner.avatarUrl,
                  content: row.content,
                  createdAt: row.created_at,
                },
              ];
            });
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, currentUserId, partner.nickname, partner.avatarUrl]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlderMessages || !hasMoreHistory) return;

    const oldestRealMessage = messages.find((m) => !m.id.startsWith("temp-"));
    if (!oldestRealMessage) {
      setHasMoreHistory(false);
      return;
    }

    setLoadingOlderMessages(true);
    const result = await loadOlderDmMessagesAction(conversationId, oldestRealMessage.createdAt);
    setLoadingOlderMessages(false);

    if (!result.success || !result.data) {
      showError(result.message || "이전 대화를 불러오지 못했습니다.");
      setHasMoreHistory(false);
      return;
    }

    setHasMoreHistory(result.data.hasMore);
    if (result.data.messages.length > 0) {
      setMessages((prev) => [...result.data!.messages, ...prev]);
    }
  }, [conversationId, messages, hasMoreHistory, loadingOlderMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const tempId = `temp-${generateTempId()}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        senderName: "나",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      pendingSendsRef.current.push({ tempId, content: trimmed });
      setMessages((prev) => [...prev, optimisticMessage]);

      const result = await sendDmMessageAction(conversationId, trimmed);

      if (!result.success) {
        pendingSendsRef.current = pendingSendsRef.current.filter((p) => p.tempId !== tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (result.sessionExpired) {
          void recoverFromStaleSession(result.message);
        } else {
          showError(result.message);
        }
      }
    },
    [conversationId, currentUserId]
  );

  return {
    messages,
    hasMoreHistory,
    loadingOlderMessages,
    loadOlderMessages,
    sendMessage,
  };
}
