import { DailyStatsPanel } from "@/components/admin/daily-stats-panel";
import { getDailyStatsAction } from "@/app/actions/admin";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * 일자별 지표 조회 화면 — 대시보드의 "오늘" 카드들을 날짜 범위로 비교할 수 있게 한다.
 * 첫 진입 시 별도 조회 없이 바로 볼 수 있도록 최근 7일치를 서버에서 미리 조회해 전달한다.
 */
export default async function AdminStatsPage() {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const initialDateFrom = toDateInputValue(sevenDaysAgo);
  const initialDateTo = toDateInputValue(today);
  const initialResults = await getDailyStatsAction(initialDateFrom, initialDateTo);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">일자별 통계</h1>
      <DailyStatsPanel
        statsAction={getDailyStatsAction}
        initialDateFrom={initialDateFrom}
        initialDateTo={initialDateTo}
        initialResults={initialResults}
      />
    </div>
  );
}
