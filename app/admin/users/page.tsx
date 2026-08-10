import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/admin/data-table";
import { searchAdminUsers, getDashboardStats } from "@/lib/queries/admin";

/**
 * 회원 목록 — 닉네임/이메일/가입일/최근 접속/정지 상태(§DEVELOPMENT_PLAN 7.5.4).
 * 게스트 현황(guest_profiles count)은 대시보드 지표를 재사용해 상단 요약 카드로 표시한다.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [users, stats] = await Promise.all([searchAdminUsers(q), getDashboardStats()]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">회원</h1>

      <Card className="max-w-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            현재 게스트 수
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats?.guestCount ?? "-"}</p>
        </CardContent>
      </Card>

      <DataTable
        searchPlaceholder="닉네임/이메일 검색"
        emptyMessage="회원이 없습니다."
        rows={users}
        rowKey={(row) => row.id}
        columns={[
          {
            key: "username",
            header: "닉네임",
            render: (row) => (
              <Link href={`/admin/users/${row.id}`} className="font-medium hover:underline">
                {row.username ?? "(미설정)"}
              </Link>
            ),
          },
          { key: "email", header: "이메일", render: (row) => row.email ?? "-" },
          {
            key: "createdAt",
            header: "가입일",
            render: (row) => new Date(row.createdAt).toLocaleDateString("ko-KR"),
          },
          {
            key: "lastSeenAt",
            header: "최근 접속",
            render: (row) => new Date(row.lastSeenAt).toLocaleString("ko-KR"),
          },
          {
            key: "status",
            header: "상태",
            render: (row) => {
              const isSuspended =
                row.suspendedAt &&
                (!row.suspendedUntil || new Date(row.suspendedUntil) > new Date());
              return isSuspended ? (
                <Badge variant="destructive">정지됨</Badge>
              ) : (
                <Badge variant="outline">정상</Badge>
              );
            },
          },
        ]}
      />
    </div>
  );
}
