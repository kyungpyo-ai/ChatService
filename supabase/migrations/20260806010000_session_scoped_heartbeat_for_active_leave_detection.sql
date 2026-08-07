-- 활성 세션 이탈 감지를 세션 전용 하트비트로 교체 (Phase 5.5 마무리, 2026-08-06)
-- 배경: 직전 마이그레이션(20260806000000)은 검색/온라인표시용 profiles.last_seen_at을
-- 재사용해 활성 세션 안전망을 만들었는데, 라이브로 다시 검토해보니 두 가지 문제가 있었다.
--   1) 그 하트비트는 탭이 백그라운드로 가면 갱신을 멈춘다(lib/hooks/use-heartbeat.ts) — 검색
--      화면의 "온라인 상태"에는 맞는 동작이지만, 채팅 중 잠깐 다른 탭을 봤다고 상대가 나간 걸로
--      오판해 세션을 강제 종료시키는 새 버그가 생긴다.
--   2) Presence leave 이벤트가 놓치는 원인을 realtime 로그로 직접 확인해보니, "브라우저를
--      비정상 종료해서"가 아니라 Realtime 테넌트 자체가 접속자가 뜸하면 통째로 잠들었다 깨는
--      주기와 재연결 타이밍이 겹치면 발생하는 것으로 보인다(get_logs로 tenant shutdown/
--      reinitialize 사이클 확인). 클라이언트가 이미 캐시해둔 presence 로스터를 다시 읽는 방식
--      으로는 이 유실을 못 잡는다 — 서버가 애초에 diff를 못 보낸 것이므로 클라이언트 쪽 재확인이
--      의미가 없다.
--
-- 해결: 검색용 하트비트와 완전히 분리된, 이 세션 전용의 하트비트를 둔다. random_sessions에
-- 참여자별 last_seen 컬럼을 추가하고, 세션 화면이 열려있는 동안(탭이 백그라운드여도 멈추지
-- 않음 — "채팅 중"과 "지금 이 탭을 보고 있음"은 다른 개념이다) 10초 간격으로 갱신 + 상대방
-- 컬럼을 조회한다. 이제 Presence leave는 "되면 좋은" 빠른 경로일 뿐이고, 실제 신뢰 소스는 이
-- 하트비트가 된다. match_or_wait()/end_abandoned_random_sessions()의 DB 레벨 안전망도 같은
-- 컬럼을 보되, 클라이언트 폴링이 이미 대부분 처리하므로 훨씬 느슨한 임계값(90초)의 최후
-- 보험으로만 남긴다.

alter table public.random_sessions
  add column last_seen_a_at timestamptz not null default now(),
  add column last_seen_b_at timestamptz not null default now();

create or replace function public.heartbeat_random_session(p_session_id uuid)
returns table (status text, partner_last_seen_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_a boolean;
begin
  select (rs.user_a_id = v_uid) into v_is_a
  from public.random_sessions rs
  where rs.id = p_session_id and v_uid in (rs.user_a_id, rs.user_b_id);

  if v_is_a is null then
    return;
  end if;

  if v_is_a then
    update public.random_sessions set last_seen_a_at = now() where id = p_session_id;
  else
    update public.random_sessions set last_seen_b_at = now() where id = p_session_id;
  end if;

  return query
  select rs.status, (case when v_is_a then rs.last_seen_b_at else rs.last_seen_a_at end)
  from public.random_sessions rs
  where rs.id = p_session_id;
end;
$$;

revoke all on function public.heartbeat_random_session(uuid) from public, anon;
grant execute on function public.heartbeat_random_session(uuid) to authenticated;

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
  v_partner_last_seen timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select rs.id, (case when rs.user_a_id = v_uid then rs.last_seen_b_at else rs.last_seen_a_at end)
    into v_session_id, v_partner_last_seen
  from public.random_sessions rs
  where rs.status = 'active' and (rs.user_a_id = v_uid or rs.user_b_id = v_uid)
  limit 1;

  if v_session_id is not null then
    if v_partner_last_seen < now() - interval '90 seconds' then
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
    and least(rs.last_seen_a_at, rs.last_seen_b_at) < now() - interval '90 seconds';
end;
$$;

-- 더 이상 어떤 함수도 참조하지 않는 이전 헬퍼 정리(§20260805000000) — profiles/guest_profiles
-- 기반 하트비트는 검색 온라인표시 용도로만 남고, 활성 세션 감지는 위 세션 전용 컬럼으로 대체됐다.
drop function if exists public.user_last_seen_at(uuid);
