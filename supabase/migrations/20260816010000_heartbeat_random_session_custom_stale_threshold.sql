-- Presence leave 신호를 "빠른 힌트"로 안전하게 재도입하기 위한 준비 (2026-08-16)
-- 배경: 매칭 직후 정기 하트비트(10초 주기, 25초 임계값)만으로는 최악의 경우 최대 35초까지
-- 걸려야 상대 이탈을 감지한다. Presence leave 이벤트는 훨씬 빠르지만(수 초 내), 단독으로
-- 즉시 종료에 쓰면 채널 재연결 타이밍에 가짜 신호가 뜨는 문제가 있었다(§20260816 이전 수정).
-- 해결: Presence leave는 "의심"만 하고, 곧바로 종료하지 않는다. 클라이언트가 짧게 대기한
-- 뒤(상대의 정상 하트비트 주기 1회분만큼) 이 함수를 "더 짧은 임계값"으로 다시 호출해
-- 재검증한다 — 그 사이 상대가 진짜로 하트비트를 보냈으면 통과, 여전히 조용하면 종료.
-- 클라이언트가 임계값(초)을 상황에 맞게 고를 수 있도록 매개변수화한다 — 기본값 25초는
-- 기존 정기 폴링 동작을 그대로 유지하고, Presence 재검증 경로만 더 짧은 값(예: 10초)을 넘긴다.

drop function if exists public.heartbeat_random_session(uuid);

create or replace function public.heartbeat_random_session(p_session_id uuid, p_stale_seconds integer default 25)
returns table (status text, ended_by uuid, partner_stale boolean)
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
      < now() - (p_stale_seconds || ' seconds')::interval
  from public.random_sessions rs
  where rs.id = p_session_id;
end;
$$;

revoke all on function public.heartbeat_random_session(uuid, integer) from public, anon;
grant execute on function public.heartbeat_random_session(uuid, integer) to authenticated;
