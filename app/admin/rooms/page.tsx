import { redirect } from "next/navigation";
import Link from "next/link";
import { StatusTabs } from "@/components/admin/status-tabs";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { getActiveRoomList, getRoomArchiveList } from "@/lib/queries/admin";

/**
 * 방채팅 통합 조회 화면 — "진행 중"/"종료됨" 탭으로 하나의 화면에서 전환한다
 * (§DEVELOPMENT_PLAN 7.5.4). 탭 상태는 `?status=active|archived` 쿼리로 관리한다.
 */
export default async function AdminRoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const currentStatus = status === "archived" ? "archived" : "active";

  if (status !== "active" && status !== "archived") {
    redirect(`/admin/rooms?status=active`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">방채팅</h1>
      <StatusTabs current={currentStatus} />

      {currentStatus === "active" ? (
        <ActiveRoomsTable query={q} />
      ) : (
        <ArchivedRoomsTable query={q} />
      )}
    </div>
  );
}

async function ActiveRoomsTable({ query }: { query?: string }) {
  const rooms = await getActiveRoomList(query);

  return (
    <DataTable
      searchPlaceholder="제목/방장 닉네임 검색"
      emptyMessage="진행 중인 방이 없습니다."
      rows={rooms}
      rowKey={(row) => row.id}
      columns={[
        {
          key: "title",
          header: "제목",
          render: (row) => (
            <Link href={`/admin/rooms/${row.id}`} className="font-medium hover:underline">
              {row.title}
              {row.isPrivate && (
                <Badge variant="outline" className="ml-2">
                  비공개
                </Badge>
              )}
            </Link>
          ),
        },
        { key: "owner", header: "방장", render: (row) => row.ownerNickname ?? "-" },
        {
          key: "members",
          header: "인원",
          render: (row) => `${row.memberCount} / ${row.maxMembers}`,
        },
        {
          key: "createdAt",
          header: "생성일",
          render: (row) => new Date(row.createdAt).toLocaleString("ko-KR"),
        },
      ]}
    />
  );
}

async function ArchivedRoomsTable({ query }: { query?: string }) {
  const archives = await getRoomArchiveList(query);

  return (
    <DataTable
      searchPlaceholder="제목 검색"
      emptyMessage="종료된 방 기록이 없습니다."
      rows={archives}
      rowKey={(row) => row.id}
      columns={[
        {
          key: "title",
          header: "제목",
          render: (row) => (
            <Link href={`/admin/rooms/archived/${row.id}`} className="font-medium hover:underline">
              {row.title}
            </Link>
          ),
        },
        { key: "members", header: "참여 인원", render: (row) => row.memberCount },
        {
          key: "archivedAt",
          header: "삭제 시각",
          render: (row) => new Date(row.archivedAt).toLocaleString("ko-KR"),
        },
      ]}
    />
  );
}
