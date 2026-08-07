-- 랜덤채팅 대기열 하트비트 기반 TTL 정리 (Phase 5 보완, 2026-08-04)
-- 배경: 브라우저 탭을 그냥 닫으면 클라이언트 JS가 실행될 기회가 없어 서버에 이탈을 알릴 수 없다.
-- 대기 화면이 이미 5초 간격으로 match_or_wait()를 폴백 폴링하고 있으므로, 이 재호출을
-- 하트비트로 재활용해 20초 이상 갱신되지 않은 대기열 행을 죽은 것으로 간주해 정리한다.
-- queued_at(FIFO 정렬 기준)과 last_seen_at(하트비트)을 분리해 하트비트 갱신이 대기 순서를
-- 어지럽히지 않게 한다.

alter table public.random_queue
  add column last_seen_at timestamptz not null default now();

create or replace function public.match_or_wait()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_partner uuid;
  v_session_id uuid;
  v_stale_before timestamptz := now() - interval '20 seconds';
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select id into v_session_id
  from public.random_sessions
  where status = 'active' and (user_a_id = v_uid or user_b_id = v_uid)
  limit 1;
  if v_session_id is not null then
    return v_session_id;
  end if;

  delete from public.random_queue where last_seen_at < v_stale_before;

  if exists (select 1 from public.random_queue where user_id = v_uid) then
    update public.random_queue set last_seen_at = now() where user_id = v_uid;
    return null;
  end if;

  select rq.user_id into v_partner
  from public.random_queue rq
  where rq.user_id <> v_uid
  order by
    exists (
      select 1 from public.random_sessions rs
      where rs.started_at > now() - interval '30 minutes'
        and ((rs.user_a_id = v_uid and rs.user_b_id = rq.user_id)
          or (rs.user_a_id = rq.user_id and rs.user_b_id = v_uid))
    ) asc,
    rq.queued_at asc
  for update skip locked
  limit 1;

  if v_partner is null then
    insert into public.random_queue (user_id) values (v_uid);
    return null;
  end if;

  delete from public.random_queue where user_id = v_partner;

  insert into public.random_sessions (user_a_id, user_b_id)
  values (v_partner, v_uid)
  returning id into v_session_id;

  return v_session_id;
end;
$$;
