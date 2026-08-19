import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserClaims } from "@/lib/supabase/auth";
import {
  getRoomDetail,
  getMyRoomMembership,
  getRoomMembers,
  getRoomMessages,
} from "@/lib/queries/rooms";
import { RoomChatView } from "@/components/rooms/room-chat-view";
import { RoomJoinView } from "@/components/rooms/room-join-view";
import { Button } from "@/components/ui/button";
import { Ban, Users } from "lucide-react";

export default async function RoomChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;

  // 방 정보 조회와 로그인 확인은 서로 의존하지 않으므로 병렬로 보낸다.
  const [room, claims] = await Promise.all([getRoomDetail(roomId), getCurrentUserClaims()]);

  if (!room) {
    notFound();
  }

  const userId = claims?.sub;

  if (!userId) {
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
          <Button className="bg-brand-gradient text-brand-foreground rounded-(--radius-card) hover:brightness-105">
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  let isMember = await getMyRoomMembership(roomId, userId);
  let joinErrorMessage: string | undefined;

  // 공개방은 "입장하기" 화면 없이 클릭 즉시 채팅방으로 들어가도록, 서버에서 바로 참여를
  // 시도한다. join_room()은 비공개방이어도 비밀번호 검증보다 먼저 강퇴 이력을 확인하므로,
  // 강퇴된 사용자인지는 비공개방에서도 비밀번호 없이 미리 판별할 수 있다 — 그래서 privacy와
  // 무관하게 항상 한 번 시도한다. 성공하면 그대로 채팅방을 렌더링하고, 실패 사유가
  // "강퇴됨"이면 입장하기 화면 자체를 건너뛰고 바로 안내만 보여준다(참여 흐름과 동일하게
  // 별도 클릭 없이 즉시 결과를 알 수 있어야 한다는 요청). 그 외 실패(정원 초과·비밀번호 필요
  // 등)는 기존 입장하기 화면으로 폴백한다.
  if (!isMember) {
    const { error: joinError } = await supabase.rpc("join_room", { p_room_id: roomId });
    if (!joinError) {
      isMember = true;
    } else {
      joinErrorMessage = joinError.message;
    }
  }

  if (!isMember && joinErrorMessage?.includes("banned_from_room")) {
    return (
      <div className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <Ban size={20} />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold">{room.title}</h1>
          <p className="text-muted-foreground text-sm">강퇴된 방에는 다시 입장할 수 없습니다.</p>
        </div>
        <Link href="/rooms">
          <Button variant="outline" className="rounded-(--radius-card)">
            방 목록으로 돌아가기
          </Button>
        </Link>
      </div>
    );
  }

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
      currentUserId={userId}
    />
  );
}
