"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatChatTime } from "@/lib/utils/date";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";
import type { RoomMember } from "@/lib/queries/rooms";

interface MessageRow {
  id: string;
  sender_id: string;
  content_type: string;
  content: string;
  created_at: string;
}

interface RoomMemberJoinRow {
  role: string;
  user: { id: string; username: string | null; avatar_url: string | null } | null;
}

interface RoomLiveState {
  messages: ChatMessage[];
  participants: RoomMember[];
}

/**
 * 방채팅 실시간 상태 — 텍스트 메시지 송수신 + 참여자 입장/퇴장 반영 (§ARCHITECTURE 7)
 *
 * 이 프로젝트의 Realtime 서버는 채널 하나에 postgres_changes 바인딩을 2개 이상 걸면
 * 클라이언트는 "SUBSCRIBED"를 받지만 서버 측 등록이 조용히 실패하는 것으로 확인됐고(격리 재현),
 * DELETE 이벤트의 old row도 REPLICA IDENTITY FULL을 설정해도 기본키만 전달되어 "누가 나갔는지"를
 * payload만으로 특정할 수 없었다. 그래서 room_members 변경은 event: "*" 단일 바인딩 하나로 받고,
 * 이벤트가 오면 참여자 목록을 다시 조회해 이전 상태와 비교(diff)해서 입장/퇴장을 판단한다.
 *
 * 참여자 변동마다 채널을 재구독하면 메시지 유실 위험이 있으므로, 최신 참여자 목록은
 * ref로 들고 있다가 발신자 닉네임 조회에만 사용하고 effect 의존성에는 넣지 않는다.
 * RLS가 적용된 채널이라 room_members에 속하지 않은 사용자는 애초에 이벤트를 받지 못한다.
 */
export function useRoomMessages(
  roomId: string,
  initialMessages: ChatMessage[],
  initialParticipants: RoomMember[],
  currentUserId: string
): RoomLiveState {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [participants, setParticipants] = useState<RoomMember[]>(initialParticipants);
  const participantsRef = useRef<RoomMember[]>(initialParticipants);

  useEffect(() => {
    const supabase = createClient();
    let channels: ReturnType<typeof supabase.channel>[] = [];
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

      const messageChannel = supabase
        .channel(`room-${roomId}-messages`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
          (payload) => {
            const row = payload.new as MessageRow;
            const sender = participantsRef.current.find((p) => p.id === row.sender_id);

            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [
                ...prev,
                {
                  id: row.id,
                  senderId: row.sender_id,
                  senderName: sender?.nickname ?? "익명",
                  senderAvatarUrl: sender?.avatarUrl,
                  content: row.content_type === "text" ? row.content : "",
                  imageUrl: row.content_type === "image" ? row.content : null,
                  createdAt: formatChatTime(row.created_at),
                },
              ];
            });
          }
        )
        .subscribe();

      const memberChangeChannel = supabase
        .channel(`room-${roomId}-members`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
          async () => {
            const { data } = await supabase
              .from("room_members")
              .select("role, user:profiles!room_members_user_id_fkey(id, username, avatar_url)")
              .eq("room_id", roomId)
              .order("joined_at", { ascending: true });

            const nextParticipants: RoomMember[] = (
              (data as unknown as RoomMemberJoinRow[] | null) ?? []
            )
              .filter((m) => m.user !== null)
              .map((m) => ({
                id: m.user!.id,
                nickname: m.user!.username ?? "익명",
                avatarUrl: m.user!.avatar_url,
                isOwner: m.role === "owner",
              }));

            const prevParticipants = participantsRef.current;
            const prevIds = new Set(prevParticipants.map((p) => p.id));
            const nextIds = new Set(nextParticipants.map((p) => p.id));

            const joined = nextParticipants.filter((p) => !prevIds.has(p.id));
            const left = prevParticipants.filter((p) => !nextIds.has(p.id));

            participantsRef.current = nextParticipants;
            setParticipants(nextParticipants);

            const now = new Date().toISOString();
            const systemMessages: ChatMessage[] = [];

            for (const p of joined) {
              if (p.id === currentUserId) continue;
              systemMessages.push({
                id: `join-${p.id}-${now}`,
                senderId: p.id,
                senderName: p.nickname,
                content: `${p.nickname}님이 입장했습니다`,
                createdAt: formatChatTime(now),
                isSystemNotice: true,
              });
            }
            for (const p of left) {
              if (p.id === currentUserId) continue;
              systemMessages.push({
                id: `leave-${p.id}-${now}`,
                senderId: p.id,
                senderName: p.nickname,
                content: `${p.nickname}님이 나갔습니다`,
                createdAt: formatChatTime(now),
                isSystemNotice: true,
              });
            }

            if (systemMessages.length > 0) {
              setMessages((prev) => [...prev, ...systemMessages]);
            }
          }
        )
        .subscribe();

      channels = [messageChannel, memberChangeChannel];
    })();

    return () => {
      cancelled = true;
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [roomId, currentUserId]);

  return { messages, participants };
}
