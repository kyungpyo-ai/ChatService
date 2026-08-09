"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { PinnedNoticeBar } from "@/components/chat/pinned-notice-bar";
import { ChatMessageBubble, type ChatMessage } from "@/components/chat/chat-message-bubble";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { ParticipantList, ParticipantSidePanel } from "@/components/rooms/participant-list";
import { LeaveRoomDialog } from "@/components/rooms/leave-room-dialog";
import { useRoomMessages } from "@/lib/realtime/messages";
import { useRoomPresence } from "@/lib/realtime/presence";
import { kickMemberAction, leaveRoomAction } from "@/app/actions/rooms";
import { showError, showInfo } from "@/lib/utils/toast";
import type { RoomMember } from "@/lib/queries/rooms";

interface RoomChatViewProps {
  roomId: string;
  title: string;
  memberCount: number;
  maxMembers: number;
  notice: string;
  initialMessages: ChatMessage[];
  participants: RoomMember[];
  currentUserId: string;
}

export function RoomChatView({
  roomId,
  title,
  maxMembers,
  notice,
  initialMessages,
  participants: initialParticipants,
  currentUserId,
}: RoomChatViewProps) {
  const router = useRouter();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const { messages, participants, roomDeleted, kicked, sendMessage, sendImageMessage } =
    useRoomMessages(roomId, initialMessages, initialParticipants, currentUserId);
  const onlineUserIds = useRoomPresence(roomId, currentUserId);
  const isOwner = participants.some((p) => p.id === currentUserId && p.isOwner);
  const memberCount = participants.length;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 초기 로딩 시 + 새 메시지가 올 때마다 스크롤을 맨 아래로 이동한다. scrollIntoView는 컨테이너의
  // 하단 padding까지는 못 밀어줘서 스크롤이 진짜 끝까지 안 간 것처럼 보이는 문제가 있어,
  // 컨테이너의 scrollTop을 scrollHeight로 직접 맞춘다.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // 방장이 나가서 방이 삭제되면(leave_room 함수가 rooms 행을 cascade 삭제) 잔류 사용자에게
  // 안내하고 잠시 후 방 목록으로 돌려보낸다.
  useEffect(() => {
    if (!roomDeleted) return;
    showInfo("방장이 나가서 방이 삭제되었습니다.");
    const timer = setTimeout(() => router.push("/rooms"), 1800);
    return () => clearTimeout(timer);
  }, [roomDeleted, router]);

  // 방장에게 강퇴당하면 room_bans INSERT를 실시간으로 받아 kicked가 true가 된다(§lib/realtime/messages).
  useEffect(() => {
    if (!kicked) return;
    showInfo("방장에 의해 강퇴되었습니다.");
    const timer = setTimeout(() => router.push("/rooms"), 1800);
    return () => clearTimeout(timer);
  }, [kicked, router]);

  const handleSend = (text: string) => {
    if (roomDeleted || kicked) return;
    void sendMessage(text);
  };

  const handleSendImage = async (file: File) => {
    if (roomDeleted || kicked) return;
    await sendImageMessage(file);
  };

  const handleKick = async (targetUserId: string) => {
    const result = await kickMemberAction(roomId, targetUserId);
    if (!result.success) {
      showError(result.message);
    }
  };

  const handleLeave = async () => {
    setLeaveDialogOpen(false);
    const result = await leaveRoomAction(roomId);
    if (!result.success) {
      showError(result.message);
      return;
    }
    router.push("/rooms");
  };

  return (
    <div className="flex h-screen">
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <ChatHeader
          title={title}
          backHref="/rooms"
          memberCount={memberCount}
          maxMembers={maxMembers}
          onOpenParticipants={() => setParticipantsOpen(true)}
          onLeave={() => setLeaveDialogOpen(true)}
        />
        <PinnedNoticeBar notice={notice} />

        {roomDeleted && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 text-center text-sm font-medium">
            방장이 나가서 방이 삭제되었습니다. 잠시 후 방 목록으로 이동합니다.
          </div>
        )}
        {kicked && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 text-center text-sm font-medium">
            방장에 의해 강퇴되었습니다. 잠시 후 방 목록으로 이동합니다.
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
        </div>

        <ChatInputBar
          onSend={handleSend}
          onSendImage={handleSendImage}
          disabled={roomDeleted || kicked}
        />
      </div>

      <ParticipantSidePanel
        participants={participants}
        onlineUserIds={onlineUserIds}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onKick={handleKick}
      />
      <ParticipantList
        participants={participants}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        onlineUserIds={onlineUserIds}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onKick={handleKick}
      />
      <LeaveRoomDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onConfirm={handleLeave}
        isOwner={isOwner}
      />
    </div>
  );
}
