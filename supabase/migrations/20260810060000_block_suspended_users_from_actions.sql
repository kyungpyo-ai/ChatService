-- Phase 7.5 §7.5.2 (7) — 정지된 계정의 행위 차단
--
-- 정지된 계정은 로그인은 되지만(재로그인 시 상태 확인이 가능해야 하므로 로그인 자체는 막지
-- 않는다) 방 입장/매칭/메시지 전송/이미지 업로드가 거부된다. is_user_suspended()는 SECURITY
-- DEFINER로 profiles를 직접 조회해 RLS 정책 안에서 호출해도 재귀가 발생하지 않는다
-- (is_admin()과 동일한 패턴, §7.5.1).
create or replace function public.is_user_suspended(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select suspended_at is not null
        and (suspended_until is null or suspended_until > now())
      from public.profiles
      where id = p_user_id
    ),
    false
  );
$$;

revoke all on function public.is_user_suspended(uuid) from public, anon;
grant execute on function public.is_user_suspended(uuid) to authenticated;

-- join_room(): 기존 게스트 차단 체크 다음 자리에 정지 체크를 추가한다.
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

  if public.is_user_suspended(auth.uid()) then
    raise exception 'user_suspended';
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

-- match_or_wait(): 로그인 확인 다음 자리에 정지 체크를 추가한다.
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
  v_partner_last_seen timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if public.is_user_suspended(v_uid) then
    raise exception 'user_suspended';
  end if;

  select rs.id, (case when rs.user_a_id = v_uid then rs.last_seen_b_at else rs.last_seen_a_at end)
    into v_session_id, v_partner_last_seen
  from public.random_sessions rs
  where rs.status = 'active' and (rs.user_a_id = v_uid or rs.user_b_id = v_uid)
  limit 1;

  if v_session_id is not null then
    if v_partner_last_seen < now() - interval '90 seconds' then
      update public.random_sessions
      set status = 'ended', ended_at = now(), ended_by = null
      where id = v_session_id;
      v_session_id := null;
    else
      return v_session_id;
    end if;
  end if;

  if exists (select 1 from public.random_queue where user_id = v_uid) then
    update public.random_queue set last_seen_at = now() where user_id = v_uid;
  end if;

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

-- messages INSERT RLS: 정지된 발신자는 방채팅/랜덤채팅 모두에서 전송이 거부된다.
drop policy if exists "room participants can send room messages" on public.messages;
create policy "room participants can send room messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and room_id is not null
    and not public.is_user_suspended(auth.uid())
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = messages.room_id and rm.user_id = auth.uid()
    )
  );

drop policy if exists "session participants can send session messages" on public.messages;
create policy "session participants can send session messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and session_id is not null
    and not public.is_user_suspended(auth.uid())
    and exists (
      select 1 from public.random_sessions rs
      where rs.id = messages.session_id
        and rs.status = 'active'
        and auth.uid() in (rs.user_a_id, rs.user_b_id)
    )
  );

-- chat-images Storage 업로드 정책: 정지된 사용자는 이미지 업로드도 거부된다.
drop policy if exists "chat image participants can upload" on storage.objects;
create policy "chat image participants can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images'
    and not public.is_user_suspended(auth.uid())
    and (
      (
        (storage.foldername(name))[1] = 'rooms'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_room_member(((storage.foldername(name))[2])::uuid)
      )
      or (
        (storage.foldername(name))[1] = 'sessions'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and exists (
          select 1 from public.random_sessions rs
          where rs.id = ((storage.foldername(objects.name))[2])::uuid
            and rs.status = 'active'
            and (auth.uid() = rs.user_a_id or auth.uid() = rs.user_b_id)
        )
      )
    )
  );
