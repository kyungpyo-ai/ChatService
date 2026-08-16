-- 방채팅 화면의 중복 하트비트 정리 (2026-08-16)
-- 배경: (chat)/layout.tsx가 전역 하트비트(HeartbeatProvider, 60초, profiles.last_seen_at)를
-- 무조건 마운트하고, 방채팅 화면(RoomChatView)은 이와 별개로 useRoomHeartbeat(60초,
-- profiles.room_heartbeat_*)를 또 마운트하고 있었다 — 같은 사용자가 방채팅 화면을 열어두는
-- 동안 같은 profiles 행을 향해 완전히 독립적인 두 개의 60초 타이머가 동시에 돌며 매번
-- Vercel 함수 호출 + Supabase 쓰기를 두 배로 만들었다(§실사용 최적화 요청, 2026-08-16).
--
-- 해결: heartbeat_room_presence()가 room_heartbeat_* 갱신과 함께 last_seen_at까지 같은
-- UPDATE로 처리하고, record_daily_activity()도 같은 호출 안에서 실행한다. 이제
-- (chat)/layout.tsx는 전역 하트비트를 마운트하지 않고, 방채팅은 이 함수 하나로 충분하다.
-- 랜덤채팅은 RandomChatView가 useHeartbeat()를 직접 마운트해 그대로 유지한다(별도 관심사).

create or replace function public.heartbeat_room_presence(p_room_id uuid)
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
  set room_heartbeat_room_id = p_room_id, room_heartbeat_at = now(), last_seen_at = now()
  where id = auth.uid();

  perform public.record_daily_activity();
end;
$$;

revoke all on function public.heartbeat_room_presence(uuid) from public, anon;
grant execute on function public.heartbeat_room_presence(uuid) to authenticated;
