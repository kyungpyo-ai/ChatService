import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAdminUserDetail } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";
import { SuspendUserDialog } from "@/components/admin/suspend-user-dialog";
import { UnsuspendUserButton } from "@/components/admin/unsuspend-user-button";
import { ForceDeleteAccountButton } from "@/components/admin/force-delete-account-button";

/**
 * 회원 상세 — 참여 중인 방 수, 본인 대상 신고 이력, "정지"/"정지 해제"/"강제 탈퇴" 액션
 * (§DEVELOPMENT_PLAN 7.5.4). "최근 대화 이력"은 방/세션별 상세로 흩어져 있어 이 화면에서는
 * 참여 중인 방 개수만 요약하고, 실제 대화 열람은 §7.5.4의 통합 조회 화면(/admin/rooms,
 * /admin/random)에서 진행한다.
 */
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await getAdminUserDetail(userId);
  if (!user) {
    notFound();
  }

  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, status, created_at")
    .eq("target_type", "user")
    .eq("target_id", userId)
    .order("created_at", { ascending: false });

  const isSuspended =
    user.suspendedAt && (!user.suspendedUntil || new Date(user.suspendedUntil) > new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {user.username ?? "(미설정)"}
            {isSuspended && (
              <Badge variant="destructive" className="ml-2">
                정지됨
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{user.email ?? "-"}</p>
        </div>
        <div className="flex gap-2">
          {isSuspended ? (
            <UnsuspendUserButton userId={userId} />
          ) : (
            <SuspendUserDialog userId={userId} />
          )}
          <ForceDeleteAccountButton userId={userId} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <InfoCard label="가입일" value={new Date(user.createdAt).toLocaleDateString("ko-KR")} />
        <InfoCard label="최근 접속" value={new Date(user.lastSeenAt).toLocaleString("ko-KR")} />
        <InfoCard label="참여 중인 방" value={String(user.roomCount)} />
        <InfoCard label="피신고 횟수" value={String(user.reportCount)} />
      </div>

      {isSuspended && (
        <div className="bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
          정지 사유: {user.suspendedReason ?? "-"} · 정지 만료:{" "}
          {user.suspendedUntil ? new Date(user.suspendedUntil).toLocaleString("ko-KR") : "영구"}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">신고 이력</h2>
        {!reports || reports.length === 0 ? (
          <p className="text-muted-foreground text-sm">신고 이력이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {reports.map((report) => (
              <li key={report.id} className="bg-surface rounded-md border p-2 text-sm">
                <Link href={`/admin/reports/${report.id}`} className="hover:underline">
                  {report.reason} · {report.status} ·{" "}
                  {new Date(report.created_at).toLocaleDateString("ko-KR")}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-md border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
