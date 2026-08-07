-- 오래된 익명(게스트) 계정 자동 정리 (Phase 5 보완, 2026-08-04)
-- 배경: 랜덤채팅은 로그인 없이 signInAnonymously()로 매번 새 게스트 신원을 발급한다
-- (lib/hooks/use-random-matching.ts). 이 익명 auth.users/profiles 행은 삭제 로직이 전혀 없어
-- 브라우저를 새로 열 때마다(시크릿창, 쿠키 삭제, 테스트 등) 계속 누적되기만 했다.
-- 익명 계정은 실명 가입 사용자와 달리 "그 순간의 대화"에만 의미가 있으므로, 일정 기간
-- 활동이 없으면(하트비트 last_seen_at 기준, Phase 4 온라인 상태 갱신과 동일 컬럼 재사용) 자동
-- 삭제한다. profiles.id -> auth.users.id가 on delete cascade이므로 auth.users만 지우면
-- profiles/random_queue/관련 messages(세션이 남아있다면)까지 함께 정리된다.
-- 현재 대기열/활성 세션에 참여 중인 계정은 절대 지우지 않는다.

create or replace function public.cleanup_stale_anonymous_users()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users u
  using public.profiles p
  where u.id = p.id
    and p.is_anonymous = true
    and p.last_seen_at < now() - interval '7 days'
    and not exists (select 1 from public.random_queue rq where rq.user_id = u.id)
    and not exists (
      select 1 from public.random_sessions rs
      where rs.status = 'active' and u.id in (rs.user_a_id, rs.user_b_id)
    );
end;
$$;

revoke all on function public.cleanup_stale_anonymous_users() from public, anon, authenticated;

create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-stale-anonymous-users') then
    perform cron.schedule(
      'cleanup-stale-anonymous-users',
      '0 3 * * *',
      $job$select public.cleanup_stale_anonymous_users()$job$
    );
  end if;
end;
$$;
