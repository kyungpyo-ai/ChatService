-- 랜덤채팅 매칭 로직을 담당하는 SECURITY DEFINER 함수 3종 (Phase 5, DEVELOPMENT_PLAN.md §5.3)
--
-- match_or_wait(): random_queue를 FOR UPDATE SKIP LOCKED로 조회해 두 사용자가 같은 상대를
-- 동시에 선점하는 경쟁 상태를 막는다(RND-03). 이미 활성 세션/대기열 등록이 있으면 그대로 반환하는
-- 멱등 함수로 만들어, 대기 화면의 5초 폴백 폴링이 부작용 없이 재호출될 수 있게 한다(§5.1).
-- 최근 30분 이내 대화한 상대는 완전히 제외하지 않고 정렬 순위만 뒤로 미룬다(대기 무한정 지연 방지).
create or replace function public.match_or_wait()
returns uuid -- 매칭 성사 시 (신규 또는 기존) session id, 대기 상태 진입 시 null
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_partner uuid;
  v_session_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- 이미 활성 세션이 있으면 그대로 반환 (새로고침 등으로 재호출되어도 멱등, RND-02)
  select id into v_session_id
  from public.random_sessions
  where status = 'active' and (user_a_id = v_uid or user_b_id = v_uid)
  limit 1;
  if v_session_id is not null then
    return v_session_id;
  end if;

  -- 이미 대기열에 있으면 재등록하지 않음 (폴백 폴링 재호출 대비 멱등, §5.1)
  if exists (select 1 from public.random_queue where user_id = v_uid) then
    return null;
  end if;

  -- 최근에 이미 대화했던 상대는 완전히 제외하지 않고 순위만 뒤로 미룬다(§5.1) —
  -- recently_matched가 true인 후보는 false인 후보보다 항상 뒤로 정렬되고,
  -- 그런 후보밖에 없으면 결국 그 상대와도 매칭된다(대기 무한정 지연 방지).
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

create or replace function public.cancel_random_queue()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.random_queue where user_id = auth.uid();
end;
$$;

-- 이미 종료된 세션에 대한 중복 호출은 where status = 'active' 조건으로 조용히 무시된다
-- (재매칭 시 "혹시 몰라 종료 호출" 패턴을 써도 안전).
create or replace function public.end_random_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.random_sessions
  set status = 'ended', ended_at = now(), ended_by = auth.uid()
  where id = p_session_id
    and status = 'active'
    and auth.uid() in (user_a_id, user_b_id);
end;
$$;

revoke all on function public.match_or_wait() from public, anon;
revoke all on function public.cancel_random_queue() from public, anon;
revoke all on function public.end_random_session(uuid) from public, anon;
grant execute on function public.match_or_wait() to authenticated;
grant execute on function public.cancel_random_queue() to authenticated;
grant execute on function public.end_random_session(uuid) to authenticated;
