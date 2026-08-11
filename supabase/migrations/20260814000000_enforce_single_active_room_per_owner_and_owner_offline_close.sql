-- 1인 1방 제약 + 방장 오프라인 시 방 자동 종료 (2026-08-14)
--
-- 배경 1: 한 사용자가 방을 여러 개 만들 수 있어 방 목록이 지저분해지고 관리가 혼란스럽다.
-- rooms 행이 삭제되면(leave_room의 방장 분기) "활성 방"이라는 개념 자체가 사라지므로 별도
-- status 컬럼 없이 owner_id에 unique 제약만 걸면 "활성 방 1개"가 자연히 보장된다.
--
-- 배경 2: 지금은 방장이 leave_room()을 명시적으로 호출해야만(나가기 버튼) 방이 삭제된다.
-- 브라우저를 그냥 끄거나 강제 종료하면 방이 영영 남아있고, 위 unique 제약과 맞물려 방장은
-- 새 방을 만들 수도 없게 된다. 랜덤채팅 활성 세션 감지(20260806000000)와 동일한 3중 패턴
-- (presence leave 감지 + heartbeat 신선도 검증 + cron 백스톱)을 방채팅에도 적용한다.

-- (a) 아카이브+삭제 로직을 leave_room()에서 재사용 가능한 함수로 추출한다.
-- 외부에서 직접 호출할 이유가 없으므로(항상 leave_room/close_room_if_owner_offline/
-- close_abandoned_owner_rooms 같은 SECURITY DEFINER 함수 내부에서만 쓰임) 모든 role의
-- 실행 권한을 회수한다.
create or replace function public.archive_and_delete_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.room_archives
    (original_room_id, title, owner_id, max_members, is_private, member_ids, created_at, messages)
  select
    r.id, r.title, r.owner_id, r.max_members, r.is_private,
    coalesce(
      (select array_agg(rm.user_id) from public.room_members rm where rm.room_id = r.id),
      array[]::uuid[]
    ),
    r.created_at,
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
        where m.room_id = r.id
      ),
      '[]'::jsonb
    )
  from public.rooms r
  where r.id = p_room_id;

  delete from public.rooms where id = p_room_id;
end;
$$;

revoke all on function public.archive_and_delete_room(uuid) from public, anon, authenticated;

-- unique 제약을 걸기 전에, 이미 한 사용자가 여러 방을 만들어둔 기존 데이터를 정리한다. 가장
-- 최근에 만든 방만 남기고 나머지는 (다른 종료 경로와 동일하게) 아카이브 후 삭제한다 — 그냥
-- delete하면 신고 대응용 기록이 안 남는 문제가 재발한다.
do $$
declare
  v_room record;
begin
  for v_room in
    select id from public.rooms r
    where r.id not in (
      select distinct on (owner_id) id
      from public.rooms
      order by owner_id, created_at desc
    )
  loop
    perform public.archive_and_delete_room(v_room.id);
  end loop;
end;
$$;

alter table public.rooms add constraint rooms_owner_id_key unique (owner_id);

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
    perform public.archive_and_delete_room(p_room_id);
  else
    delete from public.room_members where room_id = p_room_id and user_id = auth.uid();
  end if;
end;
$$;

-- (c) 멤버가 트리거하는 "방장 오프라인 시 방 종료" — Presence leave 이벤트가 도착했을 때
-- (client-side, lib/realtime/presence.ts의 onlineUserIds 변화) 남은 멤버 중 한 명이 호출한다.
-- 임의 room_id로 호출해 남의 방을 지울 수 없도록 호출자가 실제 그 방의 멤버인지 먼저 검증한다.
-- 방장의 heartbeat_room_presence() 갱신 주기(60초)의 1.5배인 90초를 신선도 임계값으로 쓴다
-- (랜덤채팅 20260806000000과 동일 컨벤션) — 새로고침 등으로 인한 presence 순단만으로 방이
-- 지워지지 않도록, 실제로 하트비트가 끊긴 경우에만 삭제한다.
create or replace function public.close_room_if_owner_offline(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_heartbeat_room_id uuid;
  v_heartbeat_at timestamptz;
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

  select owner_id into v_owner_id from public.rooms where id = p_room_id;

  if v_owner_id is null then
    return;
  end if;

  select room_heartbeat_room_id, room_heartbeat_at
    into v_heartbeat_room_id, v_heartbeat_at
  from public.profiles
  where id = v_owner_id;

  if v_heartbeat_room_id is distinct from p_room_id
    or v_heartbeat_at is null
    or v_heartbeat_at < now() - interval '90 seconds'
  then
    perform public.archive_and_delete_room(p_room_id);
  end if;
end;
$$;

revoke all on function public.close_room_if_owner_offline(uuid) from public, anon;
grant execute on function public.close_room_if_owner_offline(uuid) to authenticated;

-- (d) cron 백스톱 — 방장 혼자 있는 방에서 방장이 나가면 (b)를 트리거해줄 다른 멤버가 없으므로
-- presence 감지에만 의존할 수 없다. 방금 생성돼 방장이 아직 방채팅 화면을 열지 않은 방까지
-- 즉시 지우지 않도록, 방장의 하트비트가 없으면 rooms.created_at을 fallback으로 쓴다
-- (end_abandoned_random_sessions()의 coalesce(user_last_seen_at(...), started_at)와 동일 이유).
-- 임계값은 하트비트 신선도(90초)보다 여유 있게 3분으로 둔다 — cron은 1분 간격으로만 돌기
-- 때문에 너무 타이트하면 정상적으로 접속 중인 방장의 방도 오탐할 여지가 커진다.
create or replace function public.close_abandoned_owner_rooms()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room record;
begin
  for v_room in
    select r.id
    from public.rooms r
    join public.profiles p on p.id = r.owner_id
    where coalesce(
      case when p.room_heartbeat_room_id = r.id then p.room_heartbeat_at else null end,
      r.created_at
    ) < now() - interval '3 minutes'
  loop
    perform public.archive_and_delete_room(v_room.id);
  end loop;
end;
$$;

revoke all on function public.close_abandoned_owner_rooms() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'close-abandoned-owner-rooms') then
    perform cron.unschedule('close-abandoned-owner-rooms');
  end if;

  perform cron.schedule(
    'close-abandoned-owner-rooms',
    '* * * * *',
    $job$select public.close_abandoned_owner_rooms()$job$
  );
end;
$$;
