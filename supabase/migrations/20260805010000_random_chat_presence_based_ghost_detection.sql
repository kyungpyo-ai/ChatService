-- 랜덤채팅 유령 감지를 Presence 기반으로 재설계 (Phase 5.5, 2026-08-05)
-- 배경: DEVELOPMENT_PLAN.md §5.5 참고. 시간 기반 추측(대기열 20초 TTL, 활성 세션 2분 staleness
-- 체크)을 매칭/종료 감지의 주 경로에서 걷어내고, 클라이언트가 실제로 관찰한 Realtime Presence
-- 상태를 신뢰 소스로 쓰도록 바꾼다. 시간 기반 로직은 완전히 없애지 않되, 정상 흐름에서는 절대
-- 발동하지 않는 훨씬 느슨한 안전망(cold path)으로 강등한다.

-- 1) match_or_wait() — 20초 TTL 인라인 삭제 제거, presence roster 기반 후보 필터링 추가.
--    p_live_user_ids가 주어지면(대기 화면이 자신의 Presence 채널에서 관찰한 "지금 진짜 연결된"
--    사용자 uid 목록) 그 목록에 없는 대기열 행은 애초에 후보로 고르지 않는다 — 매칭 시점의 실제
--    연결 상태로 즉시 판단하므로 지연이 없다. null이면(구버전 호출 등) 필터 없이 기존처럼 동작.
drop function if exists public.match_or_wait();

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

  -- 이미 활성 세션이 있으면 그대로 반환. 상대가 말없이 사라진 경우의 감지는 더 이상 여기서
  -- 시간을 추측하지 않고, 클라이언트의 세션 Presence 채널(leave 이벤트)이 즉시 처리하고,
  -- 정말 아무도 없는 경우(둘 다 이탈)만 end_abandoned_random_sessions() 안전망이 정리한다.
  select id into v_session_id
  from public.random_sessions
  where status = 'active' and (user_a_id = v_uid or user_b_id = v_uid)
  limit 1;
  if v_session_id is not null then
    return v_session_id;
  end if;

  if exists (select 1 from public.random_queue where user_id = v_uid) then
    update public.random_queue set last_seen_at = now() where user_id = v_uid;
    return null;
  end if;

  select rq.user_id into v_partner
  from public.random_queue rq
  where rq.user_id <> v_uid
    and (p_live_user_ids is null or rq.user_id = any(p_live_user_ids))
  order by
    exists (
      select 1 from public.random_sessions rs
      where rs.started_at > now() - interval '30 minutes'
        and ((rs.user_a_id = v_uid and rs.user_b_id = rq.user_id)
          or (rs.user_a_id = rq.user_id and rs.user_b_id = v_uid))
    ) asc,
    rq.queued_at asc
  for update skip locked
  limit 1;

  if v_partner is null then
    insert into public.random_queue (user_id) values (v_uid);
    return null;
  end if;

  delete from public.random_queue where user_id = v_partner;

  insert into public.random_sessions (user_a_id, user_b_id)
  values (v_partner, v_uid)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

revoke all on function public.match_or_wait(uuid[]) from public, anon;
grant execute on function public.match_or_wait(uuid[]) to authenticated;

-- 2) 대기열 안전망 — 20초 인라인 삭제 대신, match_or_wait 핫패스와 분리된 저빈도 cron으로 훨씬
--    느슨한 TTL(10분)만 정리한다. Presence가 정상 동작하는 한 이 배치가 지울 행은 거의 없어야 한다.
create or replace function public.cleanup_stale_random_queue()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.random_queue where last_seen_at < now() - interval '10 minutes';
$$;

revoke all on function public.cleanup_stale_random_queue() from public, anon, authenticated;

-- 3) 활성 세션 안전망 — 양쪽 다 24시간 넘게 무응답인 세션만 강제 종료(아카이브 후 삭제).
--    참가자 중 누구라도 last_seen_at을 확인할 수 없으면(탈퇴 등) 세션 시작 시각을 기준으로 삼는다.
create or replace function public.end_abandoned_random_sessions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session record;
begin
  for v_session in
    select rs.id
    from public.random_sessions rs
    where rs.status = 'active'
      and least(
        coalesce(public.user_last_seen_at(rs.user_a_id), rs.started_at),
        coalesce(public.user_last_seen_at(rs.user_b_id), rs.started_at)
      ) < now() - interval '24 hours'
  loop
    insert into public.random_session_archives
      (original_session_id, user_a_id, user_b_id, started_at, ended_at, ended_by, messages)
    select
      rs.id, rs.user_a_id, rs.user_b_id, rs.started_at, now(), null,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'sender_id', m.sender_id,
              'content', m.content,
              'content_type', m.content_type,
              'created_at', m.created_at
            )
            order by m.created_at
          )
          from public.messages m
          where m.session_id = rs.id
        ),
        '[]'::jsonb
      )
    from public.random_sessions rs
    where rs.id = v_session.id;

    delete from public.random_sessions where id = v_session.id;
  end loop;
end;
$$;

revoke all on function public.end_abandoned_random_sessions() from public, anon, authenticated;

-- 4) 두 안전망을 pg_cron에 등록 (대기열은 5분 간격, 세션은 하루 1회)
do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-stale-random-queue') then
    perform cron.schedule(
      'cleanup-stale-random-queue',
      '*/5 * * * *',
      $job$select public.cleanup_stale_random_queue()$job$
    );
  end if;

  if not exists (select 1 from cron.job where jobname = 'end-abandoned-random-sessions') then
    perform cron.schedule(
      'end-abandoned-random-sessions',
      '0 4 * * *',
      $job$select public.end_abandoned_random_sessions()$job$
    );
  end if;
end;
$$;
