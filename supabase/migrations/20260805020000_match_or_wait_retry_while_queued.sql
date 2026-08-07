-- match_or_wait() 이미 대기열에 있어도 매번 파트너 탐색을 재시도하도록 수정 (Phase 5.5 보완)
-- 배경: 기존 로직은 "이미 대기열에 있으면 하트비트만 갱신하고 즉시 반환"했다. 그래서 두 사용자가
-- 정확히 동시에 매칭을 시작해 서로를 못 본 채 둘 다 자기 자신을 대기열에 등록해버리면(§5.1에서
-- 언급된 "동시 매칭 경쟁 상태"), 이후 재시도(폴링이든 presence 이벤트든)해봐야 항상 이 이른
-- return에 걸려 서로를 다시 찾지 못했다 — 제3의 사용자가 나타나기 전까지는 영원히 대기.
-- 이번 재작업(Presence 기반 즉시 재시도)이 이 케이스를 훨씬 자주 유발하는 것을 Playwright로
-- 재현하며 발견했다. 수정: 이미 대기열에 있어도 하트비트만 갱신하고 끝내지 않고, 그대로
-- 파트너 탐색을 이어간다 — 매 호출이 "재시도"로서 실제로 의미가 있어야 하기 때문이다.

create or replace function public.match_or_wait(p_live_user_ids uuid[] default null)
returns uuid
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

  select id into v_session_id
  from public.random_sessions
  where status = 'active' and (user_a_id = v_uid or user_b_id = v_uid)
  limit 1;
  if v_session_id is not null then
    return v_session_id;
  end if;

  -- 이미 대기열에 있으면 하트비트만 갱신 — 반환하지 않고 아래에서 파트너 탐색을 계속한다.
  if exists (select 1 from public.random_queue where user_id = v_uid) then
    update public.random_queue set last_seen_at = now() where user_id = v_uid;
  end if;

  select rq.user_id into v_partner
  from public.random_queue rq
  where rq.user_id <> v_uid
    and (p_live_user_ids is null or rq.user_id = any(p_live_user_ids))
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
    insert into public.random_queue (user_id) values (v_uid)
    on conflict (user_id) do nothing;
    return null;
  end if;

  delete from public.random_queue where user_id = v_partner;
  delete from public.random_queue where user_id = v_uid;

  insert into public.random_sessions (user_a_id, user_b_id)
  values (v_partner, v_uid)
  returning id into v_session_id;

  return v_session_id;
end;
$$;
