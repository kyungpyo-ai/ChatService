"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "lucide-react";
import { showError } from "@/lib/utils/toast";
import type { AdminDailyStat } from "@/lib/queries/admin";

const MAX_RANGE_DAYS = 90;

function diffInDays(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / (24 * 60 * 60 * 1000));
}

// null이면 스냅샷이 없는(기능 도입 이전) 날짜라는 뜻 — "0"과 구분해 "-"로 표시한다.
function cell(value: number | null): string {
  return value === null ? "-" : String(value);
}

interface Column {
  key: keyof Omit<AdminDailyStat, "date">;
  label: string;
}

const COLUMNS: Column[] = [
  { key: "totalUsers", label: "총 회원" },
  { key: "newUsers", label: "신규 회원" },
  { key: "deletedUsers", label: "탈퇴 회원" },
  { key: "activeRooms", label: "방채팅" },
  { key: "roomsCreated", label: "신규 방채팅" },
  { key: "roomsDeleted", label: "삭제 방채팅" },
  { key: "randomSessionsMatched", label: "랜덤채팅 세션" },
];

interface DailyStatsPanelProps {
  statsAction: (dateFrom: string, dateTo: string) => Promise<AdminDailyStat[]>;
  initialDateFrom: string;
  initialDateTo: string;
  initialResults: AdminDailyStat[];
}

/**
 * 대시보드에 보이는 모든 지표를 일자별로 조회하는 화면. 날짜 범위는 필수이며 최대 90일로
 * 제한한다(admin_get_daily_stats가 generate_series로 매일 1행씩 만들어 보여주므로, 범위가
 * 너무 넓으면 화면이 무의미해진다). 첫 진입 시 별도 클릭 없이 볼 수 있도록 서버 컴포넌트에서
 * 미리 조회한 최근 7일치를 initial* prop으로 받아 초기 상태로 사용한다.
 * "오늘"은 실시간 계산값, 그 이전 날짜는 23:55 cron 스냅샷 값이다.
 */
export function DailyStatsPanel({
  statsAction,
  initialDateFrom,
  initialDateTo,
  initialResults,
}: DailyStatsPanelProps) {
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [results, setResults] = useState<AdminDailyStat[] | null>(initialResults);
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    if (dateFrom > dateTo) {
      showError("시작일이 종료일보다 늦을 수 없습니다.");
      return;
    }
    if (diffInDays(dateFrom, dateTo) > MAX_RANGE_DAYS) {
      showError(`날짜 범위는 최대 ${MAX_RANGE_DAYS}일까지 조회할 수 있습니다.`);
      return;
    }

    startTransition(async () => {
      const data = await statsAction(dateFrom, dateTo);
      setResults(data);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">시작일</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">종료일</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={handleSearch} disabled={isPending}>
          조회
        </Button>
      </div>

      {results !== null &&
        (results.length === 0 ? (
          <EmptyState icon={SearchX} title="조회 결과가 없습니다." />
        ) : (
          <div className="bg-surface overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>날짜</TableHead>
                  {COLUMNS.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...results].reverse().map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium whitespace-nowrap">{row.date}</TableCell>
                    {COLUMNS.map((col) => (
                      <TableCell key={col.key}>{cell(row[col.key])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
    </div>
  );
}
