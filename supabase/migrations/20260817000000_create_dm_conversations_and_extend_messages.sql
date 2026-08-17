-- Phase 11 — 쪽지(DM): dm_conversations 테이블 신설 + messages 테이블을 3-way 컨텍스트로 확장
--
-- 설계 근거는 docs/ROADMAP.md Phase 11 참고. 메시지는 새 테이블을 만들지 않고 기존
-- public.messages(room_id/session_id와 동일한 패턴)를 재사용해 /admin/messages 검색,
-- Realtime publication 등록(messages는 이미 supabase_realtime에 등록되어 있음) 등
-- 기존 인프라를 그대로 활용한다.

-- 1. dm_conversations — 두 로그인 회원 사이에 정확히 하나의 대화만 존재하도록
--    (user_a_id, user_b_id)를 항상 user_a_id < user_b_id로 정규화해 unique 제약으로 강제한다.
create table public.dm_conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint dm_conversations_ordered_pair check (user_a_id < user_b_id),
  constraint dm_conversations_unique_pair unique (user_a_id, user_b_id)
);

create index dm_conversations_user_a_idx on public.dm_conversations (user_a_id, last_message_at desc);
create index dm_conversations_user_b_idx on public.dm_conversations (user_b_id, last_message_at desc);

alter table public.dm_conversations enable row level security;

-- 대화 참여자(user_a_id 또는 user_b_id 본인)만 조회 가능. user_a_id/user_b_id를 직접 비교할
-- 뿐 dm_conversations 자신을 서브쿼리하지 않으므로 room_members 같은 재귀 문제가 없다
-- (random_sessions의 "participants can view their session" 정책과 동일한 패턴).
create policy "participants can view their dm conversation"
  on public.dm_conversations for select
  to authenticated
  using (auth.uid() in (user_a_id, user_b_id));

-- 생성/갱신은 SECURITY DEFINER 함수(start_or_get_dm_conversation, 메시지 INSERT 트리거)를
-- 통해서만 이루어지도록 강제한다 (room_members/random_sessions와 동일한 패턴).
revoke insert, update, delete on public.dm_conversations from authenticated;

-- 2. messages 확장 — room_id/session_id와 나란히 dm_conversation_id를 추가하고,
--    exactly_one_context 체크를 3-way로 확장한다.
alter table public.messages
  add column dm_conversation_id uuid references public.dm_conversations(id) on delete cascade;

create index messages_dm_conversation_id_created_at_idx
  on public.messages (dm_conversation_id, created_at);

alter table public.messages drop constraint exactly_one_context;
alter table public.messages add constraint exactly_one_context check (
  num_nonnulls(room_id, session_id, dm_conversation_id) = 1
);

-- 3. messages RLS — DM 컨텍스트 select/insert 정책 추가 (room/session 기존 정책 패턴과 동일)
create policy "dm participants can view dm messages"
  on public.messages for select
  to authenticated
  using (
    dm_conversation_id is not null
    and exists (
      select 1 from public.dm_conversations dc
      where dc.id = messages.dm_conversation_id
        and auth.uid() in (dc.user_a_id, dc.user_b_id)
    )
  );

create policy "dm participants can send dm messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and dm_conversation_id is not null
    and not public.is_user_suspended(auth.uid())
    and exists (
      select 1 from public.dm_conversations dc
      where dc.id = messages.dm_conversation_id
        and auth.uid() in (dc.user_a_id, dc.user_b_id)
    )
  );

-- 4. start_or_get_dm_conversation() — 이미 대화가 있으면 기존 id 반환, 없으면 생성 후 반환.
--    (user_a_id, user_b_id) 정규화 unique 제약 덕분에 동시 요청이 와도 on conflict do nothing +
--    재조회로 항상 같은 대화 id로 수렴한다.
create or replace function public.start_or_get_dm_conversation(p_target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_user_a uuid;
  v_user_b uuid;
  v_conversation_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if v_uid = p_target_user_id then
    raise exception 'cannot_dm_self';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'guest_cannot_send_dm';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_target_user_id) then
    raise exception 'target_not_found';
  end if;

  if public.is_user_suspended(v_uid) then
    raise exception 'user_suspended';
  end if;

  v_user_a := least(v_uid, p_target_user_id);
  v_user_b := greatest(v_uid, p_target_user_id);

  insert into public.dm_conversations (user_a_id, user_b_id)
  values (v_user_a, v_user_b)
  on conflict (user_a_id, user_b_id) do nothing;

  select id into v_conversation_id
  from public.dm_conversations
  where user_a_id = v_user_a and user_b_id = v_user_b;

  return v_conversation_id;
end;
$$;

revoke all on function public.start_or_get_dm_conversation(uuid) from public, anon;
grant execute on function public.start_or_get_dm_conversation(uuid) to authenticated;

-- 5. DM 메시지가 INSERT될 때마다 dm_conversations.last_message_at을 갱신한다
--    (대화 목록의 "최근 메시지 시각순 정렬"에 사용).
create or replace function public.touch_dm_conversation_last_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.dm_conversation_id is not null then
    update public.dm_conversations
    set last_message_at = new.created_at
    where id = new.dm_conversation_id;
  end if;
  return new;
end;
$$;

create trigger on_dm_message_created
  after insert on public.messages
  for each row execute function public.touch_dm_conversation_last_message();
