import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MessageTimeline } from "@/components/admin/message-timeline";
import { getRandomArchiveDetail } from "@/lib/queries/admin";

/** 종료된 랜덤 세션 상세 — 스냅샷 메시지를 MessageTimeline으로 표시(읽기 전용). */
export default async function AdminRandomArchiveDetailPage({
  params,
}: {
  params: Promise<{ archiveId: string }>;
}) {
  const { archiveId } = await params;

  const archive = await getRandomArchiveDetail(archiveId);
  if (!archive) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          랜덤채팅 세션 {archive.originalSessionId.slice(0, 8)}
          <Badge variant="destructive" className="ml-2">
            종료됨
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          참여자 {archive.userAId.slice(0, 8)} / {archive.userBId.slice(0, 8)} · 종료:{" "}
          {new Date(archive.endedAt).toLocaleString("ko-KR")}
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">메시지 타임라인 (스냅샷)</h2>
        <MessageTimeline messages={archive.messages} />
      </div>
    </div>
  );
}
