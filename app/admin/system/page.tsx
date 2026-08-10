import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getCronJobStatus, getRateLimitAnomalies } from "@/lib/queries/admin";

/**
 * 시스템 상태 점검 — pg_cron 배치(게스트 정리, 아카이브 정리, 유령 세션 정리, 채팅 이미지 정리)
 * 최근 실행 결과 확인(§DEVELOPMENT_PLAN 7.5.4) + rate_limit_events 이상 활동 상위 목록
 * (§ROADMAP Phase 7 "이월" 메모대로 재사용).
 */
export default async function AdminSystemPage() {
  const [jobs, anomalies] = await Promise.all([getCronJobStatus(), getRateLimitAnomalies()]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">시스템 상태</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold">pg_cron 배치 실행 결과</h2>
        <div className="bg-surface rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>작업</TableHead>
                <TableHead>스케줄</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>최근 실행</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.jobId}>
                  <TableCell className="font-medium">{job.jobName}</TableCell>
                  <TableCell className="font-mono text-xs">{job.schedule}</TableCell>
                  <TableCell>
                    {job.lastStatus === "succeeded" ? (
                      <Badge variant="outline">성공</Badge>
                    ) : job.lastStatus === "failed" ? (
                      <Badge variant="destructive">실패</Badge>
                    ) : (
                      <Badge variant="secondary">{job.lastStatus ?? "기록 없음"}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {job.lastStartTime ? new Date(job.lastStartTime).toLocaleString("ko-KR") : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold">이상 활동 상위 목록 (최근 24시간)</h2>
        {anomalies.length === 0 ? (
          <p className="text-muted-foreground text-sm">이상 활동이 감지되지 않았습니다.</p>
        ) : (
          <div className="bg-surface rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>행위</TableHead>
                  <TableHead>횟수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((a, i) => (
                  <TableRow key={`${a.userId}-${a.action}-${i}`}>
                    <TableCell>{a.username ?? a.userId.slice(0, 8)}</TableCell>
                    <TableCell>{a.action}</TableCell>
                    <TableCell>{a.eventCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
