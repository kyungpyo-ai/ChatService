import { RoomChatView } from "@/components/rooms/room-chat-view";
import { mockRoomMessages } from "@/lib/mock/messages";
import { mockParticipants } from "@/lib/mock/participants";

export default async function RoomChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  await params;

  return (
    <RoomChatView
      title="수다온 사람들 모여라 😊"
      memberCount={mockParticipants.length}
      maxMembers={20}
      notice="서로 존중하며 즐거운 대화를 나누어요 😊"
      messages={mockRoomMessages}
      participants={mockParticipants}
    />
  );
}
