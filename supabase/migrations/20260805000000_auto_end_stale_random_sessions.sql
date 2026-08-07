-- 유령 상대방과의 활성 세션 자동 정리 (Phase 5 보완, 2026-08-05)
-- 배경: random_queue는 20초 하트비트 TTL로 정리되지만, 매칭이 성사된 뒤 random_sessions는
-- 만료 로직이 전혀 없었다. 한쪽이 종료 버튼 없이 그냥 브라우저를 닫아버리면 세션이 영원히
-- 'active'로 남고, match_or_wait()의 "이미 활성 세션이 있으면 그대로 반환" 분기 때문에 남은
-- 쪽(혹은 나중에 같은 신원으로 재접속한 사람)은 실제로는 아무도 없는 "유령 상대"와 계속
-- 매칭된 것처럼 보인다. 게다가 cleanup_stale_anonymous_users()는 "활성 세션에 참여 중이면
-- 정리하지 않음" 조건이 있어, 이런 유령 게스트는 영영 자동 정리 대상에서도 제외된다.
--
-- 해결: user_last_seen_at() 헬퍼로 실가입/게스트 신원 어느 쪽이든 마지막 활동 시각을 조회하고,
-- match_or_wait()가 기존 활성 세션을 그대로 돌려주기 전에 상대방이 2분(§ARCHITECTURE 5.2 기존
-- "온라인" 판단 기준과 동일 임계값, lib/queries/users.ts의 ONLINE_THRESHOLD_MS) 이상
-- 무응답이면 end_random_session()으로 먼저 정리(아카이브+삭제)한 뒤 정상 매칭 로직을 이어간다.
-- 이 분기는 대기 중 5초 폴백 폴링에서는 호출되지 않고(매칭 성사 후에는 더 이상 폴링하지 않음),
-- 오직 "이미 활성 세션이 있는 상태로 다시 /random에 들어왔을 때"만 평가되므로, 실제로 대화
-- 중인 상대의 탭이 잠깐 백그라운드로 가는 정도로는 영향받지 않는다.

create or replace function public.user_last_seen_at(p_user_id uuid)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select last_seen_at from public.profiles where id = p_user_id),
    (select last_seen_at from public.guest_profiles where id = p_user_id)
  );
$$;

revoke all on function public.user_last_seen_at(uuid) from public, anon, authenticated;

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
  v_other_id uuid;
  v_stale_before timestamptz := now() - interval '20 seconds';
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select id, (case when user_a_id = v_uid then user_b_id else user_a_id end)
    into v_session_id, v_other_id
  from public.random_sessions
  where status = 'active' and (user_a_id = v_uid or user_b_id = v_uid)
  limit 1;

  if v_session_id is not null then
    if public.user_last_seen_at(v_other_id) < now() - interval '2 minutes' then
      perform public.end_random_session(v_session_id);
    else
      return v_session_id;
    end if;
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
