import { redirect } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/admin/data-table";
import { getReportQueue } from "@/lib/queries/admin";

const REASON_LABEL: Record<string, string> = {
  spam: "스팸",
  abuse: "욕설/혐오",
  illegal: "불법 콘텐츠",
  other: "기타",
};

const TARGET_LABEL: Record<string, string> = {
  room: "방채팅",
  random_session: "랜덤채팅",
  message: "메시지",
  user: "사용자",
  post: "게시글",
  comment: "댓글",
};

/** 신고 큐 — 상태별(대기/처리완료/기각) 탭, 대상 유형·사유·신고일 목록(§DEVELOPMENT_PLAN 7.5.4). */
export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const currentStatus = status === "resolved" || status === "dismissed" ? status : "pending";

  if (status !== "pending" && status !== "resolved" && status !== "dismissed") {
    redirect("/admin/reports?status=pending");
  }

  const reports = await getReportQueue(currentStatus);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">신고</h1>

      <ReportStatusTabs current={currentStatus} />

      <DataTable
        searchPlaceholder="검색 (미구현)"
        emptyMessage="신고가 없습니다."
        rows={reports}
        rowKey={(row) => row.id}
        columns={[
          {
            key: "target",
            header: "대상",
            render: (row) => (
              <Link href={`/admin/reports/${row.id}`} className="font-medium hover:underline">
                {TARGET_LABEL[row.targetType] ?? row.targetType}
              </Link>
            ),
          },
          {
            key: "reason",
            header: "사유",
            render: (row) => REASON_LABEL[row.reason] ?? row.reason,
          },
          {
            key: "createdAt",
            header: "신고일",
            render: (row) => new Date(row.createdAt).toLocaleString("ko-KR"),
          },
        ]}
      />
    </div>
  );
}

function ReportStatusTabs({ current }: { current: string }) {
  return (
    <Tabs value={current}>
      <TabsList>
        <TabsTrigger value="pending" asChild>
          <Link href="/admin/reports?status=pending">대기</Link>
        </TabsTrigger>
        <TabsTrigger value="resolved" asChild>
          <Link href="/admin/reports?status=resolved">처리완료</Link>
        </TabsTrigger>
        <TabsTrigger value="dismissed" asChild>
          <Link href="/admin/reports?status=dismissed">기각</Link>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
