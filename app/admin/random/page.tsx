import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusTabs } from "@/components/admin/status-tabs";
import { DataTable } from "@/components/admin/data-table";
import { getActiveRandomSessionList, getRandomArchiveList } from "@/lib/queries/admin";

/**
 * 랜덤채팅 통합 조회 화면 — 진행 중인 세션 목록·타임라인(최초 계획엔 없었음, §ROADMAP Phase 7.5)을
 * 추가했다. 랜덤채팅은 신원이 익명이라 검색은 참여자 id 또는 기간 기준으로만 가능하다.
 */
export default async function AdminRandomPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const currentStatus = status === "archived" ? "archived" : "active";

  if (status !== "active" && status !== "archived") {
    redirect(`/admin/random?status=active`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">랜덤채팅</h1>
      <StatusTabs current={currentStatus} />

      {currentStatus === "active" ? (
        <ActiveSessionsTable query={q} />
      ) : (
        <ArchivedSessionsTable query={q} />
      )}
    </div>
  );
}

async function ActiveSessionsTable({ query }: { query?: string }) {
  const sessions = await getActiveRandomSessionList(query);

  return (
    <DataTable
      searchPlaceholder="참여자 id로 검색"
      emptyMessage="진행 중인 랜덤채팅 세션이 없습니다."
      rows={sessions}
      rowKey={(row) => row.id}
      columns={[
        {
          key: "id",
          header: "세션",
          render: (row) => (
            <Link href={`/admin/random/${row.id}`} className="font-medium hover:underline">
              {row.id.slice(0, 8)}
            </Link>
          ),
        },
        {
          key: "participants",
          header: "참여자",
          render: (row) => `${row.userAId.slice(0, 8)} / ${row.userBId.slice(0, 8)}`,
        },
        {
          key: "startedAt",
          header: "시작 시각",
          render: (row) => new Date(row.startedAt).toLocaleString("ko-KR"),
        },
      ]}
    />
  );
}

async function ArchivedSessionsTable({ query }: { query?: string }) {
  const archives = await getRandomArchiveList(query);

  return (
    <DataTable
      searchPlaceholder="참여자 id로 검색"
      emptyMessage="종료된 랜덤채팅 기록이 없습니다."
      rows={archives}
      rowKey={(row) => row.id}
      columns={[
        {
          key: "id",
          header: "세션",
          render: (row) => (
            <Link href={`/admin/random/archived/${row.id}`} className="font-medium hover:underline">
              {row.id.slice(0, 8)}
            </Link>
          ),
        },
        {
          key: "participants",
          header: "참여자",
          render: (row) => `${row.userAId.slice(0, 8)} / ${row.userBId.slice(0, 8)}`,
        },
        {
          key: "archivedAt",
          header: "종료 시각",
          render: (row) => new Date(row.archivedAt).toLocaleString("ko-KR"),
        },
      ]}
    />
  );
}
