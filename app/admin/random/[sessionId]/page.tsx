import { getRandomSessionTimeline } from "@/lib/queries/admin";
import { MessageTimeline } from "@/components/admin/message-timeline";
import { ForceEndRandomSessionButton } from "@/components/admin/force-end-random-session-button";

/**
 * 진행 중인 랜덤 세션 상세 — MessageTimeline + "세션 강제 종료" 버튼(§DEVELOPMENT_PLAN 7.5.4).
 * 랜덤채팅은 신원 노출 요구사항이 없으므로 참여자는 id 앞부분만 표시한다.
 */
export default async function AdminRandomSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const messages = await getRandomSessionTimeline(sessionId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">랜덤채팅 세션 {sessionId.slice(0, 8)}</h1>
        </div>
        <ForceEndRandomSessionButton sessionId={sessionId} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">메시지 타임라인</h2>
        <MessageTimeline messages={messages} />
      </div>
    </div>
  );
}
