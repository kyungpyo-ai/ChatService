"use client";

import { useState } from "react";
import { ChatHeader } from "@/components/chat/chat-header";
import { PinnedNoticeBar } from "@/components/chat/pinned-notice-bar";
import { ChatMessageBubble, type ChatMessage } from "@/components/chat/chat-message-bubble";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { ParticipantList, ParticipantSidePanel } from "@/components/rooms/participant-list";
import type { MockParticipant } from "@/lib/mock/participants";

interface RoomChatViewProps {
  title: string;
  memberCount: number;
  maxMembers: number;
  notice: string;
  messages: ChatMessage[];
  participants: MockParticipant[];
}

export function RoomChatView({
  title,
  memberCount,
  maxMembers,
  notice,
  messages,
  participants,
}: RoomChatViewProps) {
  const [participantsOpen, setParticipantsOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <ChatHeader
          title={title}
          backHref="/rooms"
          memberCount={memberCount}
          maxMembers={maxMembers}
          onOpenParticipants={() => setParticipantsOpen(true)}
        />
        <PinnedNoticeBar notice={notice} />

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              variant={message.senderId === "me" ? "me" : "other"}
            />
          ))}
        </div>

        <ChatInputBar />
      </div>

      <ParticipantSidePanel participants={participants} />
      <ParticipantList
        participants={participants}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
      />
    </div>
  );
}
