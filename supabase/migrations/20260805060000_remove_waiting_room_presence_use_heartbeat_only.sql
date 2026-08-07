-- 대기실 Presence 제거, 하트비트 신선도만으로 유령 필터링 (Phase 5.5 정리, 2026-08-05)
-- 배경: 실제 사용자 두 명으로 라이브 테스트하며 대기실 Presence 동기화가 실제 네트워크
-- 환경에서 신뢰할 수 없다는 것을 확인했다(서로 30초 넘게 같은 채널에 있어도 상대가 안 잡히는
-- 경우 재현됨). 이를 보완하려 하트비트 백업(40초 이내 신선하면 후보 인정)을 추가했는데, 이
-- 백업이 사실상 Presence가 하던 일을 이미 대체하고 있어 Presence 자체가 불필요한 복잡도+
-- 신뢰성 저하 요인으로만 남게 됐다. 대기실 Presence를 완전히 제거하고, 대기 화면의 5초 폴링
-- 덕분에 항상 최신으로 유지되는 하트비트(last_seen_at)만으로 후보를 판단한다 — 메커니즘이
-- 하나로 줄어 더 단순하고, Presence 동기화 실패 가능성이 아예 없어져 더 안정적이다.
--
-- 세션 Presence(상대 이탈 즉시 감지, `lib/realtime/random.ts`)는 그대로 유지한다 — 그건 실제로
-- 잘 동작했고, 대체할 마땅한 하트비트 기반 방법이 없다(활성 세션 중에는 폴링 자체가 없음).

drop function if exists public.match_or_wait(uuid[]);

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

  if exists (select 1 from public.random_queue where user_id = v_uid) then
    update public.random_queue set last_seen_at = now() where user_id = v_uid;
  end if;

  -- 대기 화면이 5초마다 재호출하므로, 진짜 살아있는 대기자는 항상 15초(3배 여유) 이내로
  -- 하트비트가 갱신되어 있다. 이 창을 넘긴 행은 탭이 닫혔을 가능성이 높아 후보에서 제외한다.
  select rq.user_id into v_partner
  from public.random_queue rq
  where rq.user_id <> v_uid
    and rq.last_seen_at > now() - interval '15 seconds'
  order by
    (
      exists (
        select 1 from public.random_sessions rs
        where rs.started_at > now() - interval '30 minutes'
          and ((rs.user_a_id = v_uid and rs.user_b_id = rq.user_id)
            or (rs.user_a_id = rq.user_id and rs.user_b_id = v_uid))
      )
      or exists (
        select 1 from public.random_session_archives rsa
        where rsa.started_at > now() - interval '30 minutes'
          and ((rsa.user_a_id = v_uid and rsa.user_b_id = rq.user_id)
            or (rsa.user_a_id = rq.user_id and rsa.user_b_id = v_uid))
      )
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

revoke all on function public.match_or_wait() from public, anon;
grant execute on function public.match_or_wait() to authenticated;
