import { notFound } from "next/navigation";
import { getRoomDetail } from "@/lib/queries/rooms";
import { getRoomMessageTimeline, getRoomMembersForAdmin } from "@/lib/queries/admin";
import { MessageTimeline } from "@/components/admin/message-timeline";
import { ForceDeleteRoomButton } from "@/components/admin/force-delete-room-button";
import { Badge } from "@/components/ui/badge";

/**
 * 진행 중인 방 상세 — MessageTimeline(§7.5.4) + 참여자 목록 + "강제 삭제" 버튼.
 */
export default async function AdminRoomDetailPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  const room = await getRoomDetail(roomId);
  if (!room) {
    notFound();
  }

  const [messages, members] = await Promise.all([
    getRoomMessageTimeline(roomId),
    getRoomMembersForAdmin(roomId),
  ]);

  const senderNameById = new Map(
    members.map((m) => [m.userId, m.nickname ?? m.userId.slice(0, 8)])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {room.title}
            {room.isPrivate && (
              <Badge variant="outline" className="ml-2">
                비공개
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {room.memberCount} / {room.maxMembers}명 참여 중
          </p>
        </div>
        <ForceDeleteRoomButton roomId={roomId} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold">메시지 타임라인</h2>
          <MessageTimeline messages={messages} senderNameById={senderNameById} />
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold">참여자 ({members.length}명)</h2>
          <ul className="space-y-2">
            {members.map((member) => (
              <li
                key={member.userId}
                className="bg-surface flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>{member.nickname ?? "탈퇴한 사용자"}</span>
                {member.role === "owner" && <Badge variant="secondary">방장</Badge>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
