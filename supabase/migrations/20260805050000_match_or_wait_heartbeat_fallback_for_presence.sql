-- Presence만으로 후보를 판단하던 것을 하트비트 백업과 병행하도록 보강 (Phase 5.5 긴급 보완, 2026-08-05)
-- 배경: 실제 사용자 두 명이 동시에 대기하는데도 서로 매칭이 안 되는 현상을 라이브로 재현·조사했다.
-- SQL로 직접 두 사용자의 presence 상태를 흉내내보니, 30초 이상 같은 대기실에 함께 있었는데도
-- 서로의 uid가 상대방의 presenceState()에 잡히지 않는 경우가 실제로 있었다 — Playwright(같은
-- 기기, 지연 거의 0) 테스트에서는 안 보였지만 실제 네트워크 환경(서로 다른 기기, Realtime 테넌트
-- 콜드 스타트 등)에서는 Presence 동기화 자체가 완전히 신뢰할 수 없다는 뜻이다. Presence만 신뢰
-- 소스로 쓰면 "유령과 매칭되는 문제"는 막지만 "멀쩡한 두 사람이 서로 못 찾는" 더 심각한 문제를
-- 만들 수 있다.
--
-- 해결: 후보 필터를 "presence에 있다 OR 하트비트가 40초 이내로 신선하다"로 완화한다. 대기 화면은
-- 최소 30초 간격으로 재호출하므로(폴백 폴링), 진짜 살아있는 대기자는 항상 40초 이내로 하트비트가
-- 갱신된다. Presence가 정상 동작하면 그 즉시 반영되고(빠른 경로), 혹시 presence 동기화가 실패해도
-- 최대 40초 안에는 하트비트로 구제된다(안전한 경로) — 반대로 20초 TTL이던 예전과 달리 진짜 죽은
-- 대기자를 후보로 잘못 고를 위험은 40초로 여전히 짧게 유지된다.

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
    and (
      p_live_user_ids is null
      or rq.user_id = any(p_live_user_ids)
      or rq.last_seen_at > now() - interval '40 seconds'
    )
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
