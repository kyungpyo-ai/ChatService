-- Phase 7.5 §7.5.4 — 관리자 전용 조회 SECURITY DEFINER 함수 모음
--
-- 전부 시작부에 is_admin() 재검증(§7.5.1)을 거친다. 레이아웃의 404는 화면 진입만 막을 뿐이므로
-- 함수 자체가 최종 방어선이다.

-- 진행 중인 방 검색(제목/방장 닉네임)
create or replace function public.admin_search_rooms(p_query text default null)
returns table (
  id uuid,
  title text,
  owner_id uuid,
  owner_nickname text,
  member_count bigint,
  max_members int,
  is_private boolean,
  created_at timestamptz
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
  select r.id, r.title, r.owner_id, p.username, public.room_member_count(r),
         r.max_members::int, r.is_private, r.created_at
  from public.rooms r
  left join public.profiles p on p.id = r.owner_id
  where p_query is null or p_query = ''
    or r.title ilike '%' || p_query || '%'
    or p.username ilike '%' || p_query || '%'
  order by r.created_at desc
  limit 100;
end;
$$;

-- 진행 중인 방의 전체 메시지 타임라인(시간순)
create or replace function public.admin_get_room_messages(p_room_id uuid)
returns table (
  id uuid,
  sender_id uuid,
  content_type text,
  content text,
  created_at timestamptz
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
  select m.id, m.sender_id, m.content_type, m.content, m.created_at
  from public.messages m
  where m.room_id = p_room_id
  order by m.created_at asc;
end;
$$;

-- 종료된 방 아카이브 목록(제목 검색)
create or replace function public.admin_get_room_archive_list(p_query text default null)
returns table (
  id uuid,
  original_room_id uuid,
  title text,
  owner_id uuid,
  member_count int,
  is_private boolean,
  archived_at timestamptz
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
  select ra.id, ra.original_room_id, ra.title, ra.owner_id,
         coalesce(array_length(ra.member_ids, 1), 0), ra.is_private, ra.archived_at
  from public.room_archives ra
  where p_query is null or p_query = '' or ra.title ilike '%' || p_query || '%'
  order by ra.archived_at desc
  limit 100;
end;
$$;

-- 종료된 방 아카이브 상세(스냅샷 전체 — 메시지 jsonb 포함)
create or replace function public.admin_get_room_archive_detail(p_archive_id uuid)
returns table (
  id uuid,
  original_room_id uuid,
  title text,
  owner_id uuid,
  max_members int,
  is_private boolean,
  member_ids uuid[],
  created_at timestamptz,
  messages jsonb,
  archived_at timestamptz
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
  select ra.id, ra.original_room_id, ra.title, ra.owner_id, ra.max_members,
         ra.is_private, ra.member_ids, ra.created_at, ra.messages, ra.archived_at
  from public.room_archives ra
  where ra.id = p_archive_id;
end;
$$;

-- 진행 중인 랜덤채팅 세션 검색 — 신원이 익명이라 참여자 id 부분 일치로만 검색 가능
create or replace function public.admin_search_random_sessions(p_query text default null)
returns table (
  id uuid,
  user_a_id uuid,
  user_b_id uuid,
  started_at timestamptz,
  status text
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
  select rs.id, rs.user_a_id, rs.user_b_id, rs.started_at, rs.status
  from public.random_sessions rs
  where rs.status = 'active'
    and (
      p_query is null or p_query = ''
      or rs.user_a_id::text ilike '%' || p_query || '%'
      or rs.user_b_id::text ilike '%' || p_query || '%'
    )
  order by rs.started_at desc
  limit 100;
end;
$$;

-- 진행 중인 랜덤채팅 세션의 전체 메시지 타임라인
create or replace function public.admin_get_random_session_messages(p_session_id uuid)
returns table (
  id uuid,
  sender_id uuid,
  content_type text,
  content text,
  created_at timestamptz
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
  select m.id, m.sender_id, m.content_type, m.content, m.created_at
  from public.messages m
  where m.session_id = p_session_id
  order by m.created_at asc;
end;
$$;

-- 종료된 랜덤채팅 세션 아카이브 목록(참여자 id/기간 검색)
create or replace function public.admin_get_random_archive_list(
  p_query text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null
)
returns table (
  id uuid,
  original_session_id uuid,
  user_a_id uuid,
  user_b_id uuid,
  started_at timestamptz,
  ended_at timestamptz,
  archived_at timestamptz
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
  select rsa.id, rsa.original_session_id, rsa.user_a_id, rsa.user_b_id,
         rsa.started_at, rsa.ended_at, rsa.archived_at
  from public.random_session_archives rsa
  where (
      p_query is null or p_query = ''
      or rsa.user_a_id::text ilike '%' || p_query || '%'
      or rsa.user_b_id::text ilike '%' || p_query || '%'
    )
    and (p_date_from is null or rsa.archived_at >= p_date_from)
    and (p_date_to is null or rsa.archived_at <= p_date_to)
  order by rsa.archived_at desc
  limit 100;
end;
$$;

-- 종료된 랜덤채팅 세션 아카이브 상세
create or replace function public.admin_get_random_archive_detail(p_archive_id uuid)
returns table (
  id uuid,
  original_session_id uuid,
  user_a_id uuid,
  user_b_id uuid,
  started_at timestamptz,
  ended_at timestamptz,
  ended_by uuid,
  messages jsonb,
  archived_at timestamptz
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
  select rsa.id, rsa.original_session_id, rsa.user_a_id, rsa.user_b_id,
         rsa.started_at, rsa.ended_at, rsa.ended_by, rsa.messages, rsa.archived_at
  from public.random_session_archives rsa
  where rsa.id = p_archive_id;
end;
$$;

-- 회원 검색(닉네임/이메일) — 정지 상태 컬럼 포함(§20260810030000)
create or replace function public.admin_search_users(p_query text default null)
returns table (
  id uuid,
  username text,
  email text,
  full_name text,
  gender text,
  age int,
  role text,
  created_at timestamptz,
  last_seen_at timestamptz,
  suspended_at timestamptz,
  suspended_until timestamptz,
  suspended_reason text
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
  select p.id, p.username, p.email, p.full_name, p.gender, p.age, p.role,
         p.created_at, p.last_seen_at, p.suspended_at, p.suspended_until, p.suspended_reason
  from public.profiles p
  where p_query is null or p_query = ''
    or p.username ilike '%' || p_query || '%'
    or p.email ilike '%' || p_query || '%'
  order by p.created_at desc
  limit 100;
end;
$$;

-- 회원 상세 — 참여 중인 방 수/피신고 수까지 함께 반환(§7.5.4 회원 상세 화면)
create or replace function public.admin_get_user_detail(p_user_id uuid)
returns table (
  id uuid,
  username text,
  email text,
  full_name text,
  gender text,
  age int,
  role text,
  created_at timestamptz,
  last_seen_at timestamptz,
  suspended_at timestamptz,
  suspended_until timestamptz,
  suspended_reason text,
  room_count bigint,
  report_count bigint
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
  select p.id, p.username, p.email, p.full_name, p.gender, p.age, p.role,
         p.created_at, p.last_seen_at, p.suspended_at, p.suspended_until, p.suspended_reason,
         (select count(*) from public.room_members rm where rm.user_id = p.id),
         (select count(*) from public.reports rp where rp.target_type = 'user' and rp.target_id = p.id)
  from public.profiles p
  where p.id = p_user_id;
end;
$$;

-- 대시보드 지표 — 가입자 수/DAU/활성 방·세션 수/오늘 메시지 수/대기 신고 수/게스트 수
create or replace function public.admin_get_dashboard_stats()
returns table (
  total_users bigint,
  dau bigint,
  active_rooms bigint,
  active_random_sessions bigint,
  messages_today bigint,
  pending_reports bigint,
  guest_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  return query select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where last_seen_at > now() - interval '24 hours'),
    (select count(*) from public.rooms),
    (select count(*) from public.random_sessions where status = 'active'),
    (select count(*) from public.messages where created_at > date_trunc('day', now())),
    (select count(*) from public.reports where status = 'pending'),
    (select count(*) from public.guest_profiles);
end;
$$;

-- rate_limit_events 이상 활동 상위 N명 — 클라이언트는 rate_limit_events를 직접 조회할 수
-- 없으므로(§DB_SCHEMA 8) 관리자 화면도 SECURITY DEFINER 경유로 조회한다.
create or replace function public.admin_get_rate_limit_anomalies(
  p_window_hours int default 24,
  p_limit int default 20
)
returns table (
  user_id uuid,
  username text,
  action text,
  event_count bigint
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
  select rle.user_id, p.username, rle.action, count(*) as event_count
  from public.rate_limit_events rle
  left join public.profiles p on p.id = rle.user_id
  where rle.created_at > now() - make_interval(hours => p_window_hours)
  group by rle.user_id, p.username, rle.action
  order by event_count desc
  limit p_limit;
end;
$$;

-- pg_cron 배치 최근 실행 결과 — cron.job_run_details는 postgres 슈퍼롤 소유 스키마라
-- 일반 authenticated 역할은 직접 조회할 수 없다(§7.5.4 시스템 상태 점검 화면).
create or replace function public.admin_get_cron_job_status()
returns table (
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  last_status text,
  last_start_time timestamptz,
  last_end_time timestamptz,
  last_return_message text
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
  select j.jobid, j.jobname, j.schedule, j.active,
         d.status, d.start_time, d.end_time, d.return_message
  from cron.job j
  left join lateral (
    select jrd.status, jrd.start_time, jrd.end_time, jrd.return_message
    from cron.job_run_details jrd
    where jrd.jobid = j.jobid
    order by jrd.start_time desc
    limit 1
  ) d on true
  order by j.jobname;
end;
$$;

revoke all on function public.admin_search_rooms(text) from public, anon;
revoke all on function public.admin_get_room_messages(uuid) from public, anon;
revoke all on function public.admin_get_room_archive_list(text) from public, anon;
revoke all on function public.admin_get_room_archive_detail(uuid) from public, anon;
revoke all on function public.admin_search_random_sessions(text) from public, anon;
revoke all on function public.admin_get_random_session_messages(uuid) from public, anon;
revoke all on function public.admin_get_random_archive_list(text, timestamptz, timestamptz) from public, anon;
revoke all on function public.admin_get_random_archive_detail(uuid) from public, anon;
revoke all on function public.admin_search_users(text) from public, anon;
revoke all on function public.admin_get_user_detail(uuid) from public, anon;
revoke all on function public.admin_get_dashboard_stats() from public, anon;
revoke all on function public.admin_get_rate_limit_anomalies(int, int) from public, anon;
revoke all on function public.admin_get_cron_job_status() from public, anon;

grant execute on function public.admin_search_rooms(text) to authenticated;
grant execute on function public.admin_get_room_messages(uuid) to authenticated;
grant execute on function public.admin_get_room_archive_list(text) to authenticated;
grant execute on function public.admin_get_room_archive_detail(uuid) to authenticated;
grant execute on function public.admin_search_random_sessions(text) to authenticated;
grant execute on function public.admin_get_random_session_messages(uuid) to authenticated;
grant execute on function public.admin_get_random_archive_list(text, timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_get_random_archive_detail(uuid) to authenticated;
grant execute on function public.admin_search_users(text) to authenticated;
grant execute on function public.admin_get_user_detail(uuid) to authenticated;
grant execute on function public.admin_get_dashboard_stats() to authenticated;
grant execute on function public.admin_get_rate_limit_anomalies(int, int) to authenticated;
grant execute on function public.admin_get_cron_job_status() to authenticated;
