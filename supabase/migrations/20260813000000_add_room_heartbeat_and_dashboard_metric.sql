-- 방채팅 실시간 접속자 지표 추가 (§사용자 요청)
--
-- 방채팅은 방 하나당 Realtime Presence 채널로만 접속 여부를 추적한다(lib/realtime/presence.ts,
-- useRoomPresence) — 어떤 유저가 어느 방을 열고 있는지가 DB에 전혀 저장되지 않고 클라이언트-
-- 소켓 레벨(ephemeral)에만 존재해서, 서버(관리자 대시보드)에서 전체 방을 가로질러 "지금 방채팅
-- 중인 사람 수"를 합산할 방법이 없었다. 랜덤채팅이 presence 단독 방식에서 하트비트 기반으로
-- 재설계된 것과 동일한 이유(네트워크 순단 시 presence 이벤트가 안 터지는 문제,
-- §20260805010000/20260806142930)로 방채팅도 DB에 주기적으로 기록되는 하트비트 컬럼을
-- 도입한다.
--
-- 게스트는 방채팅에 참여할 수 없으므로(§20260804145642 별칭 20260804145603/20260804145642,
-- "게스트는 방 접근 차단") profiles만 대상으로 하면 충분하다.
--
-- 신선도 윈도우/갱신 주기는 사이트 전역 접속자 판정(60초 주기 하트비트 / 2분 이내 신선도,
-- app/actions/heartbeat.ts, lib/hooks/use-heartbeat.ts)과 동일하게 맞춘다 — 방채팅 화면은
-- 랜덤채팅 대기 화면(5초 폴링/15초 신선도)과 달리 오래 열어두는 특성이 있어 그렇게 촘촘한
-- 주기가 필요하지 않고, 이미 검증된 사이트 전역 컨벤션을 재사용하는 편이 일관적이다.
alter table public.profiles
  add column room_heartbeat_room_id uuid references public.rooms (id) on delete set null,
  add column room_heartbeat_at timestamptz;

create index profiles_room_heartbeat_idx on public.profiles (room_heartbeat_room_id, room_heartbeat_at)
  where room_heartbeat_room_id is not null;

-- 로그인한 일반 사용자가 자기 하트비트를 갱신하는 용도이므로 관리자 전용 함수 컨벤션과 달리
-- is_admin() 체크는 없다 — 대신 auth.uid()로 본인 행만 갱신하고, 실제로 그 방의 멤버인 경우에만
-- 갱신을 허용해 임의의 room_id로 하트비트를 남기는 것을 막는다.
create function public.heartbeat_room_presence(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = auth.uid()
  ) then
    raise exception 'not_a_member';
  end if;

  update public.profiles
  set room_heartbeat_room_id = p_room_id, room_heartbeat_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.heartbeat_room_presence(uuid) from public, anon;
grant execute on function public.heartbeat_room_presence(uuid) to authenticated;

-- admin_compute_live_stats()/admin_get_dashboard_stats()에 room_active_users 컬럼을 추가한다.
-- RETURNS TABLE 컬럼 구성이 바뀌므로 drop ... cascade 후 의존 함수들을 순서대로
-- (헬퍼 → 그 헬퍼를 쓰는 함수들) 재생성해야 한다. admin_get_daily_stats()는 이번 지표를
-- 반환하지 않는다 — 일자별 통계는 스냅샷 성격이고 이 값은 "지금 이 순간"의 실시간 지표라
-- 스냅샷 대상이 아니지만, admin_compute_live_stats()에 의존하므로 cascade에 함께 걸려
-- 재생성은 필요하다.
drop function public.admin_get_daily_stats(date, date) cascade;
drop function public.admin_get_dashboard_stats() cascade;
drop function public.record_daily_stats_snapshot() cascade;
drop function public.admin_compute_live_stats() cascade;

create function public.admin_compute_live_stats()
returns table (
  total_users bigint,
  guest_count bigint,
  pending_reports bigint,
  dau bigint,
  rooms_created bigint,
  rooms_deleted bigint,
  active_rooms bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  online_count bigint,
  random_sessions_matched bigint,
  new_users bigint,
  deleted_users bigint,
  room_active_users bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.profiles),
    (select count(*) from public.guest_profiles),
    (select count(*) from public.reports where status = 'pending'),
    (select count(*) from public.daily_active_users where activity_date = current_date),
    (select count(*) from public.rooms where created_at > date_trunc('day', now())),
    (select count(*) from public.room_archives where archived_at > date_trunc('day', now())),
    (select count(*) from public.rooms),
    (select count(*) from public.random_sessions where status = 'active') * 2,
    (select count(*) from public.random_queue where last_seen_at > now() - interval '15 seconds'),
    (select count(*) from public.profiles where last_seen_at > now() - interval '2 minutes')
      + (select count(*) from public.guest_profiles where last_seen_at > now() - interval '2 minutes'),
    (select count(*) from public.random_sessions where started_at > date_trunc('day', now()))
      + (select count(*) from public.random_session_archives
          where started_at > date_trunc('day', now())),
    (select count(*) from public.profiles where created_at > date_trunc('day', now())),
    (select count(*) from public.account_deletions where deleted_at > date_trunc('day', now())),
    (select count(*) from public.profiles where room_heartbeat_at > now() - interval '2 minutes');
$$;

revoke all on function public.admin_compute_live_stats() from public, anon, authenticated;

create function public.record_daily_stats_snapshot()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_daily_stats (
    stat_date, total_users, new_users, deleted_users, rooms_created, rooms_deleted,
    active_rooms, random_sessions_matched
  )
  select
    current_date, total_users, new_users, deleted_users, rooms_created, rooms_deleted,
    active_rooms, random_sessions_matched
  from public.admin_compute_live_stats()
  on conflict (stat_date) do update set
    total_users = excluded.total_users,
    new_users = excluded.new_users,
    deleted_users = excluded.deleted_users,
    rooms_created = excluded.rooms_created,
    rooms_deleted = excluded.rooms_deleted,
    active_rooms = excluded.active_rooms,
    random_sessions_matched = excluded.random_sessions_matched,
    recorded_at = now();
end;
$$;

revoke all on function public.record_daily_stats_snapshot() from public, anon, authenticated;

create function public.admin_get_dashboard_stats()
returns table (
  total_users bigint,
  dau bigint,
  guest_count bigint,
  online_count bigint,
  pending_reports bigint,
  rooms_created_today bigint,
  rooms_deleted_today bigint,
  active_rooms bigint,
  random_active_participants bigint,
  random_queue_waiting_count bigint,
  random_sessions_matched_today bigint,
  new_users_today bigint,
  deleted_users_today bigint,
  room_active_users bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  return query
  select
    t.total_users, t.dau, t.guest_count, t.online_count, t.pending_reports,
    t.rooms_created, t.rooms_deleted, t.active_rooms,
    t.random_active_participants, t.random_queue_waiting_count, t.random_sessions_matched,
    t.new_users, t.deleted_users, t.room_active_users
  from public.admin_compute_live_stats() as t;
end;
$$;

create function public.admin_get_daily_stats(p_date_from date, p_date_to date)
returns table (
  stat_date date,
  total_users bigint,
  new_users bigint,
  deleted_users bigint,
  active_rooms bigint,
  rooms_created bigint,
  rooms_deleted bigint,
  random_sessions_matched bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_live record;
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  select * into v_live from public.admin_compute_live_stats();

  return query
  select
    gs.day::date,
    case when gs.day::date = current_date then v_live.total_users else s.total_users end,
    case when gs.day::date = current_date then v_live.new_users else s.new_users end,
    case when gs.day::date = current_date then v_live.deleted_users else s.deleted_users end,
    case when gs.day::date = current_date then v_live.active_rooms else s.active_rooms end,
    case when gs.day::date = current_date then v_live.rooms_created else s.rooms_created end,
    case when gs.day::date = current_date then v_live.rooms_deleted else s.rooms_deleted end,
    case when gs.day::date = current_date then v_live.random_sessions_matched
      else s.random_sessions_matched end
  from generate_series(p_date_from::timestamp, p_date_to::timestamp, interval '1 day') as gs(day)
  left join public.admin_daily_stats s on s.stat_date = gs.day::date
  order by gs.day;
end;
$$;
