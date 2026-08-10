import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MessageTimeline } from "@/components/admin/message-timeline";
import { getRoomArchiveDetail } from "@/lib/queries/admin";

/**
 * 종료된 방 상세 — 스냅샷 시점의 제목/참여자 목록/전체 메시지를 MessageTimeline으로 표시
 * (읽기 전용, 조치 버튼 없음 — 이미 삭제된 방이므로, §DEVELOPMENT_PLAN 7.5.4).
 */
export default async function AdminRoomArchiveDetailPage({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}) {
  const { archiveId } = await params;

  const archive = await getRoomArchiveDetail(archiveId);
  if (!archive) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {archive.title}
          {archive.isPrivate && (
            <Badge variant="outline" className="ml-2">
              비공개
            </Badge>
          )}
          <Badge variant="destructive" className="ml-2">
            종료됨
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          삭제 시각: {new Date(archive.archivedAt).toLocaleString("ko-KR")} · 참여자{" "}
          {archive.memberIds.length}명
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">메시지 타임라인 (스냅샷)</h2>
        <MessageTimeline messages={archive.messages} />
      </div>
    </div>
  );
}
