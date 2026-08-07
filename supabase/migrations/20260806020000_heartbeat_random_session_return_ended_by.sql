-- heartbeat_random_session()이 ended_by도 함께 반환하도록 보완 — 클라이언트 폴링이 "상대가
-- 나가서 종료됨"과 "내가 직접 종료 버튼을 눌러서 종료됨"을 구분해야 하는데(기존 postgres_changes
-- UPDATE 리스너의 ended_by !== currentUserId 판단과 동일한 기준을 맞추기 위함), status만으로는
-- 이걸 구분할 수 없다.

drop function if exists public.heartbeat_random_session(uuid);

create or replace function public.heartbeat_random_session(p_session_id uuid)
returns table (status text, ended_by uuid, partner_last_seen_at timestamptz)
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
  select rs.status, rs.ended_by,
    (case when v_is_a then rs.last_seen_b_at else rs.last_seen_a_at end)
  from public.random_sessions rs
  where rs.id = p_session_id;
end;
$$;

revoke all on function public.heartbeat_random_session(uuid) from public, anon;
grant execute on function public.heartbeat_random_session(uuid) to authenticated;
