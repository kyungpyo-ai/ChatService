-- Phase 7 (1): 방/랜덤세션 아카이브를 BEFORE DELETE 트리거로 통합 (2026-08-08)
--
-- 배경: leave_room()/archive_ended_random_sessions()이 각자 함수 안에서 수동으로
-- "아카이브 INSERT → 원본 DELETE"를 수행하고 있었다. 이 두 함수를 거치지 않고 rooms/
-- random_sessions 행이 지워지는 경로(계정 탈퇴로 인한 profiles cascade, 향후 관리자
-- 강제 삭제)는 아카이브 INSERT를 건너뛰고 바로 DELETE만 일어나 신고 대응용 30일 보존이
-- 무력화된다(§ROADMAP Phase 7 "착수 전 반드시 처리할 것" 참고).
--
-- 해결: 두 테이블에 BEFORE DELETE 트리거를 달아 "삭제되기 직전 행을 무조건 아카이브에
-- 남긴다"를 테이블 레벨에서 보장하고, 기존 함수들에서 수동 아카이브 INSERT를 제거한다.
-- 이렇게 해야 트리거가 유일한 아카이브 경로가 되어 이중 기록을 피한다.

create or replace function public.archive_room_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.room_archives
    (original_room_id, title, owner_id, max_members, is_private, member_ids, created_at, messages)
  select
    old.id, old.title, old.owner_id, old.max_members, old.is_private,
    coalesce(
      (select array_agg(rm.user_id) from public.room_members rm where rm.room_id = old.id),
      array[]::uuid[]
    ),
    old.created_at,
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
        where m.room_id = old.id
      ),
      '[]'::jsonb
    );
  return old;
end;
$$;

comment on function public.archive_room_before_delete() is
  'rooms 삭제 직전 room_archives에 스냅샷을 남긴다. 삭제 경로(leave_room의 방장 나가기, 계정 탈퇴 cascade, 향후 관리자 강제 삭제)와 무관하게 항상 실행되도록 함수가 아니라 트리거로 구현.';

drop trigger if exists archive_room_before_delete on public.rooms;
create trigger archive_room_before_delete
  before delete on public.rooms
  for each row execute function public.archive_room_before_delete();

-- leave_room()에서 수동 아카이브 INSERT 제거 — 이제 rooms DELETE 시 트리거가 대신 처리한다.
create or replace function public.leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  select owner_id into v_owner_id from public.rooms where id = p_room_id;

  if v_owner_id is null then
    raise exception 'room_not_found';
  end if;

  if v_owner_id = auth.uid() then
    delete from public.rooms where id = p_room_id;
  else
    delete from public.room_members where room_id = p_room_id and user_id = auth.uid();
  end if;
end;
$$;

-- random_sessions도 동일한 패턴. end_random_session()은 이미 status='ended' UPDATE만
-- 하고 끝나며(§20260805030000, Realtime 전달 지연을 위한 설계), 실제 삭제는 1분 간격
-- cron archive_ended_random_sessions()이 수행한다 — 여기서 수동 아카이브 INSERT를 제거한다.
--
-- 계정 탈퇴 cascade처럼 status='active'인 채로(ended_at이 아직 null인 채로) 삭제되는
-- 경우를 대비해 트리거가 ended_at/ended_by를 직접 채운다.
create or replace function public.archive_random_session_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.random_session_archives
    (original_session_id, user_a_id, user_b_id, started_at, ended_at, ended_by, messages)
  select
    old.id, old.user_a_id, old.user_b_id, old.started_at,
    coalesce(old.ended_at, now()),
    old.ended_by,
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
        where m.session_id = old.id
      ),
      '[]'::jsonb
    );
  return old;
end;
$$;

comment on function public.archive_random_session_before_delete() is
  'random_sessions 삭제 직전 random_session_archives에 스냅샷을 남긴다. archive_ended_random_sessions()의 정상 종료 경로뿐 아니라 계정 탈퇴 cascade 등 다른 삭제 경로도 함께 보장한다.';

drop trigger if exists archive_random_session_before_delete on public.random_sessions;
create trigger archive_random_session_before_delete
  before delete on public.random_sessions
  for each row execute function public.archive_random_session_before_delete();

create or replace function public.archive_ended_random_sessions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.random_sessions
  where status = 'ended' and ended_at < now() - interval '60 seconds';
end;
$$;

-- Phase 7 (2): rate limit — DB 카운터 방식
--
-- 외부 서비스(Upstash 등) 신규 연동 없이 Postgres만으로 처리한다. 메시지 전송/방 생성/
-- 이미지 업로드 3개 액션이 쓰기 직전 이 함수를 호출해 한도를 확인·기록한다.

create table public.rate_limit_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('send_message', 'create_room', 'upload_image')),
  created_at timestamptz not null default now()
);

create index rate_limit_events_user_action_idx
  on public.rate_limit_events (user_id, action, created_at desc);

alter table public.rate_limit_events enable row level security;
-- 클라이언트는 이 테이블에 직접 읽거나 쓰지 않는다 — check_and_record_rate_limit()을 통해서만 접근
revoke all on public.rate_limit_events from public, anon, authenticated;

create or replace function public.check_and_record_rate_limit(
  p_action text, p_max_count integer, p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.rate_limit_events
  where user_id = auth.uid()
    and action = p_action
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max_count then
    return false;
  end if;

  insert into public.rate_limit_events (user_id, action) values (auth.uid(), p_action);
  return true;
end;
$$;

comment on function public.check_and_record_rate_limit(text, integer, integer) is
  '호출자의 최근 p_window_seconds초 동안 p_action 횟수가 p_max_count 미만이면 이번 호출을 기록하고 true, 이상이면 기록하지 않고 false를 반환한다.';

revoke all on function public.check_and_record_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.check_and_record_rate_limit(text, integer, integer) to authenticated;

create or replace function public.cleanup_old_rate_limit_events()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.rate_limit_events where created_at < now() - interval '7 days';
$$;

revoke all on function public.cleanup_old_rate_limit_events() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-old-rate-limit-events') then
    perform cron.schedule(
      'cleanup-old-rate-limit-events',
      '0 4 * * *',
      $job$select public.cleanup_old_rate_limit_events()$job$
    );
  end if;
end;
$$;
