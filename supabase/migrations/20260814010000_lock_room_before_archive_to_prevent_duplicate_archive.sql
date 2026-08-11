-- archive_and_delete_room() 동시 호출 시 중복 아카이브 방지 (2026-08-14)
--
-- 배경: close_room_if_owner_offline()(멤버 트리거)와 close_abandoned_owner_rooms()(1분 cron)가
-- 같은 방을 거의 동시에 대상으로 삼을 수 있다 — 실제로 cron이 막 돈 직후 같은 방에 대해 수동
-- 호출을 재현했더니 room_archives에 같은 original_room_id로 행이 2개 생겼다(rooms DELETE 자체는
-- 멱등이라 조용히 넘어가지만, INSERT는 둘 다 room 삭제 전 시점의 스냅샷을 읽어와 중복 삽입함).
-- select ... for update로 rooms 행을 먼저 잠가서, 두 번째 호출자는 첫 번째가 delete+commit할
-- 때까지 대기했다가 행이 이미 사라진 걸 보고 조용히 리턴하도록 한다.
create or replace function public.archive_and_delete_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.rooms where id = p_room_id for update;

  if not found then
    return;
  end if;

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
