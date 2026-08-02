import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getRoomDetail,
  getMyRoomMembership,
  getRoomMembers,
  getRoomMessages,
} from "@/lib/queries/rooms";
import { RoomChatView } from "@/components/rooms/room-chat-view";
import { RoomJoinView } from "@/components/rooms/room-join-view";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default async function RoomChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  const room = await getRoomDetail(roomId);

  if (!room) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
        <div className="space-y-1">
          <h1 className="text-lg font-bold">{room.title}</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
            <Users size={14} />
            {room.memberCount}/{room.maxMembers}명 참여 중
          </p>
        </div>
        <p className="text-muted-foreground text-sm">방에 입장하려면 로그인이 필요합니다.</p>
        <Link href="/auth/login">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground rounded-(--radius-card)">
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  const isMember = await getMyRoomMembership(roomId, user.id);

  if (!isMember) {
    return (
      <RoomJoinView
        roomId={room.id}
        title={room.title}
        memberCount={room.memberCount}
        maxMembers={room.maxMembers}
        isPrivate={room.isPrivate}
      />
    );
  }

  const [members, messages] = await Promise.all([getRoomMembers(roomId), getRoomMessages(roomId)]);

  return (
    <RoomChatView
      roomId={room.id}
      title={room.title}
      memberCount={room.memberCount}
      maxMembers={room.maxMembers}
      notice="서로 존중하며 즐거운 대화를 나누어요 😊"
      initialMessages={messages}
      participants={members}
      currentUserId={user.id}
    />
  );
}
