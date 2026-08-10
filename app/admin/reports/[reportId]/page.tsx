import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ReportActionPanel } from "@/components/admin/report-action-panel";
import { getReportDetail } from "@/lib/queries/admin";

const REASON_LABEL: Record<string, string> = {
  spam: "스팸",
  abuse: "욕설/혐오",
  illegal: "불법 콘텐츠",
  other: "기타",
};

function targetHref(targetType: string, targetId: string): string {
  switch (targetType) {
    case "room":
      return `/admin/rooms/${targetId}`;
    case "random_session":
      return `/admin/random/${targetId}`;
    case "user":
      return `/admin/users/${targetId}`;
    default:
      return "#";
  }
}

/**
 * 신고 상세 — 대상(방/세션/메시지/사용자) 컨텍스트 미리보기 링크 + "처리"/"기각" 액션
 * (§DEVELOPMENT_PLAN 7.5.4). 방/세션이 이미 삭제·종료된 경우 활성 상세 링크는 404가 될 수
 * 있다 — 그 경우 통합 조회 화면(/admin/rooms, /admin/random)의 "종료됨" 탭에서 직접 검색해야
 * 한다(아카이브 id와 신고 대상 id가 다르므로 이 화면에서 자동 매핑하지 않음).
 */
export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  const report = await getReportDetail(reportId);
  if (!report) {
    notFound();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          신고 상세
          <Badge variant="outline" className="ml-2">
            {report.status}
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {new Date(report.createdAt).toLocaleString("ko-KR")}
        </p>
      </div>

      <div className="bg-surface space-y-2 rounded-md border p-4 text-sm">
        <p>
          <span className="text-muted-foreground">사유: </span>
          {REASON_LABEL[report.reason] ?? report.reason}
        </p>
        {report.detail && (
          <p>
            <span className="text-muted-foreground">상세: </span>
            {report.detail}
          </p>
        )}
        <p>
          <span className="text-muted-foreground">대상: </span>
          <Link href={targetHref(report.targetType, report.targetId)} className="hover:underline">
            {report.targetType} / {report.targetId.slice(0, 8)}
          </Link>
        </p>
      </div>

      {report.status === "pending" ? (
        <ReportActionPanel reportId={report.id} />
      ) : (
        <div className="bg-surface rounded-md border p-4 text-sm">
          <p>처리 결과: {report.actionTaken ?? "-"}</p>
          <p className="text-muted-foreground mt-1">
            처리 시각:{" "}
            {report.reviewedAt ? new Date(report.reviewedAt).toLocaleString("ko-KR") : "-"}
          </p>
        </div>
      )}
    </div>
  );
}
