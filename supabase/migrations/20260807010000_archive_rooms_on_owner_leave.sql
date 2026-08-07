-- 방채팅도 랜덤채팅과 동일하게 삭제 전 아카이브 (2026-08-07)
-- 배경: 방장이 나가면 leave_room()이 rooms 행을 바로 delete하고, room_members/messages/
-- room_bans가 전부 cascade로 함께 사라진다 — 신고/분쟁 대응용 기록이 전혀 안 남는다. 랜덤채팅에
-- 이미 있는 종료 시 아카이브(random_session_archives)와 같은 이유로 필요하다.
--
-- random_session_archives와의 차이: 방은 1:1 고정이 아니라 참여자가 여럿이므로 user_a_id/
-- user_b_id 대신 member_ids uuid[]로 삭제 시점의 참여자 목록을 담는다. 방장 나가기는 이미
-- 동기적으로 처리되고 있고(대기 없이 즉시 delete), 남은 참여자에게 실시간 안내도 이미 정상
-- 동작 중이므로(Phase 4 완료) 랜덤채팅 때처럼 삭제를 지연시킬 필요는 없다 — DELETE 이벤트의
-- RLS 재검증은 삭제되기 전 old row 기준이라 UPDATE 때와 달리 유실 문제가 없다.

create table public.room_archives (
  id uuid primary key default gen_random_uuid(),
  original_room_id uuid not null,
  title text not null,
  owner_id uuid,
  max_members integer not null,
  is_private boolean not null,
  member_ids uuid[] not null default '{}',
  created_at timestamptz not null,
  messages jsonb not null default '[]'::jsonb,
  archived_at timestamptz not null default now()
);

create index room_archives_original_room_id_idx on public.room_archives (original_room_id);

alter table public.room_archives enable row level security;
-- random_session_archives와 동일하게 의도적으로 조회 정책을 두지 않는다 — SECURITY DEFINER
-- 함수만 기록하고, 참여자 본인을 포함한 어떤 클라이언트 역할도 조회할 수 없다.
revoke all on public.room_archives from public, anon, authenticated;

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
  else
    delete from public.room_members where room_id = p_room_id and user_id = auth.uid();
  end if;
end;
$$;

-- 랜덤채팅 아카이브와 동일한 90일 보존 기한 정책을 방 아카이브에도 적용한다.
create or replace function public.cleanup_old_room_archives()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.room_archives where archived_at < now() - interval '90 days';
$$;

revoke all on function public.cleanup_old_room_archives() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup-old-room-archives') then
    perform cron.schedule(
      'cleanup-old-room-archives',
      '0 4 * * *',
      $job$select public.cleanup_old_room_archives()$job$
    );
  end if;
end;
$$;
