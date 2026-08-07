-- random_session_archives 보존 기한 정책 (2026-08-07)
-- 배경: 종료된 랜덤채팅 대화는 신고/분쟁 대응 목적으로 random_session_archives에 스냅샷으로
-- 영구 보관되고 있었는데, 이 테이블만 정리 로직이 전혀 없어 무한정 계속 쌓이는 상태였다
-- (다른 랜덤채팅 테이블은 전부 자동 정리됨 — random_queue, random_sessions, guest_profiles).
--
-- 해결: 신고 대응에 필요한 기간(통상 수 주~수개월 내에 신고가 들어옴)을 넉넉히 보장하면서도
-- 무한 축적은 막도록 90일 보존 기한을 두고, 매일 새벽에 정리하는 cron을 추가한다.

create or replace function public.cleanup_old_random_session_archives()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.random_session_archives where archived_at < now() - interval '90 days';
$$;

revoke all on function public.cleanup_old_random_session_archives() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-old-random-session-archives') then
    perform cron.schedule(
      'cleanup-old-random-session-archives',
      '0 4 * * *',
      $job$select public.cleanup_old_random_session_archives()$job$
    );
  end if;
end;
$$;
