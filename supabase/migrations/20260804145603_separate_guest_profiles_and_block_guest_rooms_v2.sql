-- 방채팅 게스트 입장 차단 (1/2) — PRD(§3.1/§4.1)상 방채팅은 로그인 회원 전용인데
-- join_room()/방 생성 RLS 중 "생성"만 게스트를 막고 "입장"은 막지 않던 구멍을 메운다.
-- 뒤이은 마이그레이션(v3_fix)에서 guest_profiles 테이블과 관련 FK를 정리하므로,
-- 여기서는 "게스트 여부 = profiles 행 존재 여부"라는 최종 판단 기준으로 먼저 정책/함수를 바꾼다.

drop policy "authenticated users can create rooms" on public.rooms;

create policy "authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and exists (select 1 from public.profiles p where p.id = auth.uid())
  );

alter table public.profiles drop column is_anonymous;

create or replace function public.join_room(p_room_id uuid, p_password text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_member_count integer;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid()) then
    raise exception 'guest_cannot_join_room';
  end if;

  select * into v_room from public.rooms where id = p_room_id;

  if v_room.id is null then
    raise exception 'room_not_found';
  end if;

  if exists (
    select 1 from public.room_bans b
    where b.room_id = p_room_id and b.user_id = auth.uid()
  ) then
    raise exception 'banned_from_room';
  end if;

  if exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  ) then
    return;
  end if;

  if v_room.is_private then
    if p_password is null or not (extensions.crypt(p_password, v_room.password_hash) = v_room.password_hash) then
      raise exception 'invalid_password';
    end if;
  end if;

  select count(*) into v_member_count from public.room_members where room_id = p_room_id;

  if v_member_count >= v_room.max_members then
    raise exception 'room_full';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (p_room_id, auth.uid(), 'member');
end;
$$;

-- 게스트 자동 정리 함수를 guest_profiles 기준으로 재작성한다. 이 시점엔 guest_profiles가 아직
-- 없지만(v3_fix에서 생성) plpgsql 함수 본문은 생성 시점에 테이블 존재를 검증하지 않으므로 안전하다.
create or replace function public.cleanup_stale_anonymous_users()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users u
  using public.guest_profiles g
  where u.id = g.id
    and g.last_seen_at < now() - interval '7 days'
    and not exists (select 1 from public.random_queue rq where rq.user_id = u.id)
    and not exists (
      select 1 from public.random_sessions rs
      where rs.status = 'active' and u.id in (rs.user_a_id, rs.user_b_id)
    );
end;
$$;
