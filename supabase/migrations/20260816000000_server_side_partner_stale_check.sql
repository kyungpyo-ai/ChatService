-- 랜덤채팅 상대방 하트비트 신선도 판단을 서버로 이전 (2026-08-16)
-- 배경: 매칭 직후 바로 "상대방이 대화를 종료했습니다"로 끊기는 버그를 실사용 중 재현했다.
-- Supabase 로그로 추적한 결과, 실제로 end_random_session()을 호출한 쪽은 매번 실사용자
-- 브라우저 자신이었고, 원인은 lib/realtime/random.ts의 runHeartbeat()가 서버가 내려준
-- partner_last_seen_at(timestamptz)을 클라이언트의 Date.now()와 직접 비교하던 부분이었다 —
-- 세션이 막 생성돼 상대 last_seen이 몇 초밖에 안 지났는데도 25초 이상 지난 것으로 오판했다.
-- 클라이언트 시계는 확인 결과 정상이었으므로, 남은 유력한 원인은 timestamptz 문자열을
-- new Date()로 파싱하는 과정의 타임존/포맷 불일치다 — 브라우저/OS 조합에 따라 달라질 수 있는
-- 영역이라 클라이언트에서 완전히 통제하기 어렵다.
-- 해결: "상대가 25초 넘게 조용한가"라는 판단 자체를 DB(서버 시각 기준)에서 끝내고, 클라이언트는
-- boolean 결과만 받는다 — 클라이언트 시계/파싱과 완전히 무관해진다.

drop function if exists public.heartbeat_random_session(uuid);

create or replace function public.heartbeat_random_session(p_session_id uuid)
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
    (case when v_is_a then rs.last_seen_b_at else rs.last_seen_a_at end) < now() - interval '25 seconds'
  from public.random_sessions rs
  where rs.id = p_session_id;
end;
$$;

revoke all on function public.heartbeat_random_session(uuid) from public, anon;
grant execute on function public.heartbeat_random_session(uuid) to authenticated;
