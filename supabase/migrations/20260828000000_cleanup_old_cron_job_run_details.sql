-- cron.job_run_details가 매분 도는 크론잡(archive-ended-random-sessions,
-- end-abandoned-random-sessions) 때문에 하루 약 3,150행씩 쌓여, 사용량 점검 중
-- 27MB 중 13MB(약 절반)를 이 로그 테이블 하나가 차지하고 있는 게 확인됐다(2026-08-28).
-- pg_cron 1.6.4는 관리형 Supabase에서 자동 보존 기간(GUC) 설정이 적용되지 않으므로,
-- 직접 매일 오래된 실행 로그를 지우는 크론잡을 추가한다. 실제 서비스 데이터가 아니라
-- "언제 몇 번 돌았다"는 운영 로그라 3일치만 남겨도 디버깅에 충분하다.

select cron.schedule(
  'cleanup-old-cron-job-run-details',
  '30 4 * * *',
  $$delete from cron.job_run_details where start_time < now() - interval '3 days'$$
);
