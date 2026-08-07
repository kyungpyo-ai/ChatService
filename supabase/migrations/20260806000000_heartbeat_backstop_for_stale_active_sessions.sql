-- 활성 랜덤채팅 세션의 상대방 이탈 감지를 하트비트로 보강 (Phase 5.5 보완, 2026-08-06)
-- 배경: 상대가 종료 버튼 없이 사라진 경우의 감지를 Presence leave 이벤트 하나에만 의존하고
-- 있었다. 그런데 대기실에서 이미 확인했듯(§DEVELOPMENT_PLAN 5.5) 실제 네트워크 환경에서
-- Presence 동기화/이벤트 전달 자체가 항상 즉시·확실하게 오는 게 아니다. 활성 세션은 Playwright
-- 테스트에서 leave 감지가 잘 됐다는 이유로 하트비트 안전망(user_last_seen_at 기반 staleness
-- 체크)을 완전히 제거하고 24시간짜리 cron 하나만 남겼는데(20260805010000), 라이브 테스트에서
-- Presence leave가 누락되는 경우가 실제로 재현됐다 — 상대가 브라우저를 껐는데도 남은 쪽은 계속
-- "연결된" 채팅방을 보고, 이탈한 쪽이 재접속해 다시 랜덤채팅을 시작하면 match_or_wait()가
-- "이미 활성 세션 있음"으로 그 죽은 세션을 그대로 돌려줘 재매칭 없이 복귀해버렸다.
--
-- 해결: 대기열과 동일한 하트비트 하이브리드 패턴을 활성 세션에도 적용한다. 이미 (main) 레이아웃
-- 전역에서 60초 간격 하트비트(lib/hooks/use-heartbeat.ts)가 profiles/guest_profiles.last_seen_at을
-- 갱신하고 있으므로 새 컬럼/테이블 없이 재사용한다.
--   1) match_or_wait() — 활성 세션을 그대로 돌려주기 전에 상대의 마지막 활동 시각을 확인해,
--      90초(하트비트 간격의 1.5배) 넘게 갱신이 없으면 그 세션을 즉시 'ended' 처리하고 정상적인
--      매칭 대기 흐름으로 넘어간다. Presence보다 느리지만(최악의 경우 재접속 시점까지) 확실하다.
--   2) end_abandoned_random_sessions() — 재접속을 기다리지 않고도 정리되도록 임계값을 24시간에서
--      90초로 낮추고, cron 주기도 하루 1회에서 1분 간격으로 바꾼다. 기존처럼 즉시 archive+delete
--      하지 않고 status='ended'만 세팅해 archive_ended_random_sessions()(1분 뒤 아카이브, 이미
--      존재)에 넘긴다 — 이렇게 해야 아직 화면에 남아있는 상대방이 postgres_changes UPDATE
--      이벤트를 정상적으로 받는다(즉시 delete 시 이벤트가 드롭되는 문제는 20260805030000에서
--      이미 확인됨).

create or replace function public.match_or_wait()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_partner uuid;
  v_session_id uuid;
  v_partner_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select id, (case when user_a_id = v_uid then user_b_id else user_a_id end)
    into v_session_id, v_partner_id
  from public.random_sessions
  where status = 'active' and (user_a_id = v_uid or user_b_id = v_uid)
  limit 1;

  if v_session_id is not null then
    if public.user_last_seen_at(v_partner_id) < now() - interval '90 seconds' then
      update public.random_sessions
      set status = 'ended', ended_at = now(), ended_by = null
      where id = v_session_id;
      v_session_id := null;
    else
      return v_session_id;
    end if;
  end if;

  if exists (select 1 from public.random_queue where user_id = v_uid) then
    update public.random_queue set last_seen_at = now() where user_id = v_uid;
  end if;

  select rq.user_id into v_partner
  from public.random_queue rq
  where rq.user_id <> v_uid
    and rq.last_seen_at > now() - interval '15 seconds'
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

create or replace function public.end_abandoned_random_sessions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.random_sessions rs
  set status = 'ended', ended_at = now(), ended_by = null
  where rs.status = 'active'
    and least(
      coalesce(public.user_last_seen_at(rs.user_a_id), rs.started_at),
      coalesce(public.user_last_seen_at(rs.user_b_id), rs.started_at)
    ) < now() - interval '90 seconds';
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'end-abandoned-random-sessions') then
    perform cron.unschedule('end-abandoned-random-sessions');
  end if;

  perform cron.schedule(
    'end-abandoned-random-sessions',
    '* * * * *',
    $job$select public.end_abandoned_random_sessions()$job$
  );
end;
$$;
