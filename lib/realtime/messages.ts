"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatChatTime } from "@/lib/utils/date";
import { sendRoomImageMessageAction, sendRoomMessageAction } from "@/app/actions/messages";
import { createChatImageUploadUrlAction } from "@/app/actions/chat-images";
import {
  CHAT_IMAGES_BUCKET,
  CHAT_IMAGE_MAX_SIZE_BYTES,
  CHAT_IMAGE_MIME_TO_EXTENSION,
  getSignedChatImageUrl,
  isValidChatImageMimeType,
  type ChatImageMimeType,
} from "@/lib/storage/chat-images";
import { showError } from "@/lib/utils/toast";
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
  roomDeleted: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendImageMessage: (file: File) => Promise<void>;
}

/**
 * 전송 직후 낙관적으로 붙인 메시지를 Realtime INSERT 이벤트와 매칭하기 위한 대기 큐 항목.
 *
 * 텍스트는 전송 시점에 이미 content(문자열)를 알지만, 이미지는 업로드 URL을 발급받아야
 * 비로소 Storage 경로(=content)를 알 수 있다. 그래서 이미지의 경우 낙관적 메시지를 먼저
 * 화면에 붙이고, 경로를 알게 된 시점에 이 큐에 등록한다 — 등록 시점이 실제 업로드/INSERT
 * 보다 항상 앞서므로 Realtime 이벤트를 놓치지 않는다.
 */
interface PendingSend {
  tempId: string;
  content: string;
  /** 이미지 전송인 경우의 로컬 미리보기 blob URL — reconcile 시 해제해 누수를 막는다 */
  previewUrl?: string;
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
  const [roomDeleted, setRoomDeleted] = useState(false);
  const participantsRef = useRef<RoomMember[]>(initialParticipants);
  const roomDeletedRef = useRef(false);
  // 내가 보낸 메시지 중 아직 Realtime INSERT로 되돌아오지 않은 것들의 대기 큐(FIFO)
  const pendingSendsRef = useRef<PendingSend[]>([]);

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
          async (payload) => {
            const row = payload.new as MessageRow;
            const sender = participantsRef.current.find((p) => p.id === row.sender_id);

            // row.content는 이미지 메시지의 경우 서명 URL이 아니라 Storage 경로다.
            // 비공개 버킷이라 표시하려면 별도로 서명 URL을 발급받아야 한다(텍스트는 즉시 null).
            const imageUrl =
              row.content_type === "image"
                ? await getSignedChatImageUrl(supabase, row.content)
                : null;

            // 내가 보낸 메시지라면 낙관적으로 붙여둔 임시 항목을 실제 row로 치환(reconcile)한다.
            if (row.sender_id === currentUserId) {
              const pendingIndex = pendingSendsRef.current.findIndex(
                (p) => p.content === row.content
              );
              if (pendingIndex !== -1) {
                const [pending] = pendingSendsRef.current.splice(pendingIndex, 1);
                if (pending.previewUrl) {
                  URL.revokeObjectURL(pending.previewUrl);
                }
                setMessages((prev) => {
                  if (prev.some((m) => m.id === row.id)) return prev;
                  return prev.map((m) =>
                    m.id === pending.tempId
                      ? {
                          id: row.id,
                          senderId: row.sender_id,
                          senderName: sender?.nickname ?? "익명",
                          senderAvatarUrl: sender?.avatarUrl,
                          content: row.content_type === "text" ? row.content : "",
                          imageUrl,
                          createdAt: formatChatTime(row.created_at),
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
                  senderName: sender?.nickname ?? "익명",
                  senderAvatarUrl: sender?.avatarUrl,
                  content: row.content_type === "text" ? row.content : "",
                  imageUrl,
                  createdAt: formatChatTime(row.created_at),
                },
              ];
            });
          }
        )
        .subscribe();

      const roomDeletedChannel = supabase
        .channel(`room-${roomId}-deleted`)
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
          () => {
            roomDeletedRef.current = true;
            setRoomDeleted(true);
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
              // 방장이 나가 방 자체가 삭제된 경우엔 cascade로 나머지 참여자들의 room_members 행도
              // 한꺼번에 삭제되어 "OOO님이 나갔습니다" 메시지가 우르르 쌓이므로 생략한다.
              // 대신 room-${roomId}-deleted 채널에서 받은 방 삭제 안내만 보여준다.
              if (roomDeletedRef.current) continue;
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

      channels = [messageChannel, roomDeletedChannel, memberChangeChannel];
    })();

    return () => {
      cancelled = true;
      channels.forEach((channel) => supabase.removeChannel(channel));
      // 언마운트 시점까지 reconcile되지 못한 이미지 낙관적 메시지의 blob URL을 정리한다.
      pendingSendsRef.current.forEach((pending) => {
        if (pending.previewUrl) {
          URL.revokeObjectURL(pending.previewUrl);
        }
      });
    };
  }, [roomId, currentUserId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const tempId = `temp-${crypto.randomUUID()}`;
      const self = participantsRef.current.find((p) => p.id === currentUserId);

      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        senderName: self?.nickname ?? "나",
        senderAvatarUrl: self?.avatarUrl,
        content: trimmed,
        createdAt: formatChatTime(new Date().toISOString()),
      };

      pendingSendsRef.current.push({ tempId, content: trimmed });
      setMessages((prev) => [...prev, optimisticMessage]);

      const result = await sendRoomMessageAction(roomId, trimmed);

      if (!result.success) {
        pendingSendsRef.current = pendingSendsRef.current.filter((p) => p.tempId !== tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        showError(result.message);
      }
    },
    [roomId, currentUserId]
  );

  const sendImageMessage = useCallback(
    async (file: File) => {
      const mimeType = file.type;
      if (!isValidChatImageMimeType(mimeType)) {
        showError("JPG, PNG, WEBP 형식의 이미지만 첨부할 수 있습니다.");
        return;
      }
      if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
        showError("이미지는 5MB 이하만 첨부할 수 있습니다.");
        return;
      }

      const tempId = `temp-${crypto.randomUUID()}`;
      const previewUrl = URL.createObjectURL(file);
      const self = participantsRef.current.find((p) => p.id === currentUserId);

      // 1. 경로를 알기 전이라도 로컬 blob URL로 즉시 미리보기를 붙인다(낙관적 UI).
      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        senderName: self?.nickname ?? "나",
        senderAvatarUrl: self?.avatarUrl,
        content: "",
        imageUrl: previewUrl,
        createdAt: formatChatTime(new Date().toISOString()),
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const rollback = (message: string) => {
        pendingSendsRef.current = pendingSendsRef.current.filter((p) => p.tempId !== tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        URL.revokeObjectURL(previewUrl);
        showError(message);
      };

      // 2. 업로드 URL 발급 — 이 시점에 비로소 Storage 경로(=content)를 알게 된다.
      const ticket = await createChatImageUploadUrlAction(
        "rooms",
        roomId,
        CHAT_IMAGE_MIME_TO_EXTENSION[mimeType as ChatImageMimeType]
      );
      if (!ticket.success || !ticket.data) {
        rollback(ticket.message || "이미지 업로드 준비에 실패했습니다.");
        return;
      }

      // 경로를 알게 된 시점에 pending 큐에 등록한다. 업로드/INSERT는 아직 시작 전이므로
      // Realtime INSERT 이벤트보다 항상 먼저 등록되어 reconcile 매칭을 놓치지 않는다.
      pendingSendsRef.current.push({ tempId, content: ticket.data.path, previewUrl });

      // 3. 서명 URL로 Storage에 직접 업로드(파일 바이트는 서버 액션을 거치지 않는다).
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(CHAT_IMAGES_BUCKET)
        .uploadToSignedUrl(ticket.data.path, ticket.data.token, file);

      if (uploadError) {
        rollback("이미지 업로드에 실패했습니다.");
        return;
      }

      // 4. 메시지 INSERT — 성공하면 Realtime INSERT 이벤트가 위 pending 큐를 통해 reconcile한다.
      const result = await sendRoomImageMessageAction(roomId, ticket.data.path);
      if (!result.success) {
        rollback(result.message);
      }
    },
    [roomId, currentUserId]
  );

  return { messages, participants, roomDeleted, sendMessage, sendImageMessage };
}
