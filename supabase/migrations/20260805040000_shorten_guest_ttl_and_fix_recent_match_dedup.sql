-- 게스트 TTL 단축 + "최근 상대 후순위 미루기" 복구 (Phase 5.5 보완, 2026-08-05)
--
-- 1) 게스트 계정 TTL을 7일 → 1일로 단축하고 정리 주기를 하루 1회 → 6시간마다로 앞당긴다.
-- 같은 브라우저로 재방문하면 세션(=익명 계정)이 그대로 재사용되고 하트비트가 갱신되므로
-- 정상적으로 돌아오는 사용자에게는 영향이 없다 — TTL은 진짜로 다시 안 돌아오는 죽은 계정만 지운다.
--
-- 2) match_or_wait()의 "최근 30분 이내 만난 상대는 후순위로 미루기" 로직이 random_sessions
-- 테이블만 조회하고 있었는데, 종료된 세션은 60초 뒤 archive_ended_random_sessions()가
-- random_session_archives로 옮기고 random_sessions에서 지워버리므로, 종료 후 1분만 지나도
-- 이 조회가 항상 빈 결과를 반환해 사실상 기능이 무력화되어 있었다(2026-08-05 발견). 최근 기록을
-- random_session_archives에서도 함께 조회하도록 수정한다.

create or replace function public.cleanup_stale_anonymous_users()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users u
  using public.guest_profiles g
  where u.id = g.id
    and g.last_seen_at < now() - interval '1 day'
    and not exists (select 1 from public.random_queue rq where rq.user_id = u.id)
    and not exists (
      select 1 from public.random_sessions rs
      where rs.status = 'active' and u.id in (rs.user_a_id, rs.user_b_id)
    );
end;
$$;

select cron.schedule(
  'cleanup-stale-anonymous-users',
  '0 */6 * * *',
  $job$select public.cleanup_stale_anonymous_users()$job$
);

create or replace function public.match_or_wait(p_live_user_ids uuid[] default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_partner uuid;
  v_session_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select id into v_session_id
  from public.random_sessions
  where status = 'active' and (user_a_id = v_uid or user_b_id = v_uid)
  limit 1;
  if v_session_id is not null then
    return v_session_id;
  end if;

  if exists (select 1 from public.random_queue where user_id = v_uid) then
    update public.random_queue set last_seen_at = now() where user_id = v_uid;
  end if;

  select rq.user_id into v_partner
  from public.random_queue rq
  where rq.user_id <> v_uid
    and (p_live_user_ids is null or rq.user_id = any(p_live_user_ids))
  order by
    (
      exists (
        select 1 from public.random_sessions rs
        where rs.started_at > now() - interval '30 minutes'
          and ((rs.user_a_id = v_uid and rs.user_b_id = rq.user_id)
            or (rs.user_a_id = rq.user_id and rs.user_b_id = v_uid))
      )
      or exists (
        select 1 from public.random_session_archives rsa
        where rsa.started_at > now() - interval '30 minutes'
          and ((rsa.user_a_id = v_uid and rsa.user_b_id = rq.user_id)
            or (rsa.user_a_id = rq.user_id and rsa.user_b_id = v_uid))
      )
    ) asc,
    rq.queued_at asc
  for update skip locked
  limit 1;

  if v_partner is null then
    insert into public.random_queue (user_id) values (v_uid)
    on conflict (user_id) do nothing;
    return null;
  end if;

  delete from public.random_queue where user_id = v_partner;
  delete from public.random_queue where user_id = v_uid;

  insert into public.random_sessions (user_a_id, user_b_id)
  values (v_partner, v_uid)
  returning id into v_session_id;

  return v_session_id;
end;
$$;
