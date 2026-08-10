import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats, type DashboardStats } from "@/lib/queries/admin";

interface StatCard {
  label: string;
  value: number | string;
  href: string;
}

function StatCardGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.label} href={card.href}>
          <Card className="hover:border-brand transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

/**
 * 총계/스냅샷 지표(지금 이 순간의 상태)와 오늘 하루 동안의 흐름 지표(자정 이후 누적, 매일
 * 0으로 리셋)를 섞어서 보여주면 숫자를 잘못 비교하기 쉬워서(§사용자 피드백) 물리적으로
 * 분리한다. "현재 상태"는 다시 두 종류로 나뉜다 — 하트비트 신선도 윈도우(초/분 단위 유효기간)에
 * 의존해 "지금 접속 중인가"를 판정하는 실시간 접속 지표와, 단순히 COUNT(*)로 즉시 정확한
 * 스냅샷 지표(§사용자 피드백: 실시간 정보와 아닌 것을 구분해달라는 요청). 기능(방채팅/
 * 랜덤채팅) 구분은 각 카드 라벨 텍스트로만 표시한다.
 */
function buildCardGroups(stats: DashboardStats | null) {
  return [
    {
      title: "실시간 접속 현황",
      description: "하트비트 기반 — 마지막 신호가 신선도 기준(초~분 단위) 이내인 사용자만 집계",
      cards: [
        {
          // 하트비트(60초 주기) 기준 last_seen_at이 2분 이내인 profiles + guest_profiles 합산
          label: "실시간 접속자",
          value: stats?.onlineCount ?? "-",
          href: "/admin/users",
        },
        {
          // 하트비트(60초 주기) 기준 profiles.room_heartbeat_at이 2분 이내인 회원 수 —
          // 게스트는 방채팅에 참여할 수 없어 profiles만 대상이다(§20260813000000)
          label: "방채팅 실시간 접속자",
          value: stats?.roomActiveUsers ?? "-",
          href: "/admin/rooms",
        },
        {
          // random_sessions 1행 = 1:1 매칭된 세션(참여자 2명 고정)이므로 세션 수 x2
          label: "랜덤채팅 실시간 매칭자",
          value: stats?.randomActiveParticipants ?? "-",
          href: "/admin/random",
        },
        {
          // random_queue.last_seen_at 15초 이내 — 매칭 후보 판정과 동일 기준(대기 화면 5초 폴링)
          label: "랜덤채팅 매칭 대기자",
          value: stats?.randomQueueWaitingCount ?? "-",
          href: "/admin/random",
        },
      ] satisfies StatCard[],
    },
    {
      title: "현재 상태",
      description: "지금 이 순간의 단순 집계값 — 신선도 판정 없이 항상 정확, 자정에 리셋되지 않음",
      cards: [
        { label: "총 회원", value: stats?.totalUsers ?? "-", href: "/admin/users" },
        { label: "게스트 수", value: stats?.guestCount ?? "-", href: "/admin/users" },
        { label: "대기 중인 신고", value: stats?.pendingReports ?? "-", href: "/admin/reports" },
        { label: "방채팅", value: stats?.activeRooms ?? "-", href: "/admin/rooms" },
      ] satisfies StatCard[],
    },
    {
      title: "오늘의 회원 활동",
      description: "자정부터 지금까지 누적 — 매일 0부터 다시 집계 (§기간별 비교는 일자별 통계)",
      cards: [
        {
          // daily_active_users 기반 — 캘린더 오늘 활동한 정회원+게스트 합산
          label: "서비스 이용자",
          value: stats?.dau ?? "-",
          href: "/admin/stats",
        },
        { label: "신규 회원", value: stats?.newUsersToday ?? "-", href: "/admin/users" },
        { label: "탈퇴 회원", value: stats?.deletedUsersToday ?? "-", href: "/admin/users" },
      ] satisfies StatCard[],
    },
    {
      title: "오늘의 채팅 활동",
      description: "자정부터 지금까지 누적 — 매일 0부터 다시 집계 (§기간별 비교는 일자별 통계)",
      cards: [
        { label: "신규 방채팅", value: stats?.roomsCreatedToday ?? "-", href: "/admin/rooms" },
        {
          label: "삭제 방채팅",
          value: stats?.roomsDeletedToday ?? "-",
          href: "/admin/rooms?status=archived",
        },
        {
          label: "랜덤채팅 세션",
          value: stats?.randomSessionsMatchedToday ?? "-",
          href: "/admin/random",
        },
      ] satisfies StatCard[],
    },
  ];
}

/**
 * 관리자 대시보드 — "실시간 접속 현황"(하트비트 신선도 기반), "현재 상태"(단순 스냅샷),
 * "오늘의 회원 활동"/"오늘의 채팅 활동"(흐름, 회원/채팅으로 재분리)을 보여준다
 * (§DEVELOPMENT_PLAN 7.5.4).
 */
export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  const groups = buildCardGroups(stats);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">대시보드</h1>

      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <p className="text-muted-foreground text-xs">{group.description}</p>
          </div>
          <StatCardGrid cards={group.cards} />
        </section>
      ))}
    </div>
  );
}
