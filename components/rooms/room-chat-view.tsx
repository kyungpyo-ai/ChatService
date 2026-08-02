"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { PinnedNoticeBar } from "@/components/chat/pinned-notice-bar";
import { ChatMessageBubble, type ChatMessage } from "@/components/chat/chat-message-bubble";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { ParticipantList, ParticipantSidePanel } from "@/components/rooms/participant-list";
import { LeaveRoomDialog } from "@/components/rooms/leave-room-dialog";
import { useRoomMessages } from "@/lib/realtime/messages";
import { useRoomPresence } from "@/lib/realtime/presence";
import { sendRoomMessageAction } from "@/app/actions/messages";
import { leaveRoomAction } from "@/app/actions/rooms";
import { showError } from "@/lib/utils/toast";
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
  const { messages, participants } = useRoomMessages(
    roomId,
    initialMessages,
    initialParticipants,
    currentUserId
  );
  const onlineUserIds = useRoomPresence(roomId, currentUserId);
  const isOwner = participants.some((p) => p.id === currentUserId && p.isOwner);
  const memberCount = participants.length;

  const handleSend = (text: string) => {
    void sendRoomMessageAction(roomId, text);
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
    <div className="flex min-h-screen">
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <ChatHeader
          title={title}
          backHref="/rooms"
          memberCount={memberCount}
          maxMembers={maxMembers}
          onOpenParticipants={() => setParticipantsOpen(true)}
          onLeave={() => setLeaveDialogOpen(true)}
        />
        <PinnedNoticeBar notice={notice} />

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              variant={message.senderId === currentUserId ? "me" : "other"}
            />
          ))}
        </div>

        <ChatInputBar onSend={handleSend} />
      </div>

      <ParticipantSidePanel participants={participants} onlineUserIds={onlineUserIds} />
      <ParticipantList
        participants={participants}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        onlineUserIds={onlineUserIds}
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
