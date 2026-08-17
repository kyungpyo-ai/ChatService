-- Phase 11 (재설계) — 쪽지함(단발성 쪽지): dm_notes 테이블 신설
--
-- 1차 설계("1:1 영구 대화" — dm_conversations + messages 3-way 확장)는 폐기되고 원격 DB에서도
-- 롤백됐다(§20260817030000 이전 마이그레이션 참고, ROADMAP.md Phase 11 상단 안내). 이번
-- 재설계는 "대화" 그룹 개념 자체가 없는 포털 사이트류 쪽지함이라 messages/room 계열과 완전히
-- 독립된 전용 테이블로 만든다.

create table public.dm_notes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  -- 답장은 원본을 참조만 할 뿐 새 쪽지 1건으로 독립적으로 존재한다. 원본이 지워져도(자기참조라
  -- 실제 DELETE 경로는 없지만 대비 차원) 답장 자체는 살아남도록 on delete set null.
  reply_to_id uuid references public.dm_notes(id) on delete set null,
  read_at timestamptz,
  hidden_by_sender boolean not null default false,
  hidden_by_recipient boolean not null default false,
  created_at timestamptz not null default now(),
  constraint dm_notes_no_self_send check (sender_id <> recipient_id)
);

-- 받은함(수신자 기준 최신순)과 보낸함(발신자 기준 최신순) 양쪽 조회에 쓰인다. 안읽음 개수
-- 집계는 recipient_idx로 충분히 커버된다(별도 partial index는 이 규모에서 과함).
create index dm_notes_recipient_idx on public.dm_notes (recipient_id, created_at desc);
create index dm_notes_sender_idx on public.dm_notes (sender_id, created_at desc);

alter table public.dm_notes enable row level security;

-- 발신자 또는 수신자 본인만 조회 가능. 소프트 삭제(hidden_by_*) 필터링은 애플리케이션
-- 쿼리에서 처리한다 — RLS에서까지 숨기면 "내가 삭제해도 상대 쪽 사본은 유지"라는 요구사항과
-- 충돌한다(상대가 여전히 그 행을 조회할 수 있어야 하므로).
create policy "participants can view their dm notes"
  on public.dm_notes for select
  to authenticated
  using (auth.uid() in (sender_id, recipient_id));

-- 쓰기는 전부 SECURITY DEFINER 함수를 통해서만 — INSERT는 게스트/정지 계정/자기자신 검증이
-- 필요하고, UPDATE(읽음 처리·소프트 삭제)는 호출자가 정확히 어느 쪽(발신/수신)인지에 따라
-- 다른 컬럼만 건드려야 하므로 클라이언트의 직접 쓰기를 막는다.
revoke insert, update, delete on public.dm_notes from authenticated;

-- send_dm_note() — 로그인/게스트/정지/자기자신/수신자 존재 여부를 전부 재검증한 뒤 쪽지를
-- 발송한다. reply_to_id가 있으면 호출자가 그 원본 쪽지의 참여자(발신 또는 수신)인지 확인해
-- 임의의 남의 쪽지를 답장 대상으로 참조하지 못하게 막는다.
create or replace function public.send_dm_note(
  p_recipient_id uuid,
  p_content text,
  p_reply_to_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_content text := trim(p_content);
  v_note_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if v_uid = p_recipient_id then
    raise exception 'cannot_send_to_self';
  end if;

  if v_content = '' then
    raise exception 'empty_content';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'guest_cannot_send_dm';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_recipient_id) then
    raise exception 'recipient_not_found';
  end if;

  if public.is_user_suspended(v_uid) then
    raise exception 'user_suspended';
  end if;

  if p_reply_to_id is not null and not exists (
    select 1 from public.dm_notes n
    where n.id = p_reply_to_id and v_uid in (n.sender_id, n.recipient_id)
  ) then
    raise exception 'reply_target_not_found';
  end if;

  insert into public.dm_notes (sender_id, recipient_id, content, reply_to_id)
  values (v_uid, p_recipient_id, v_content, p_reply_to_id)
  returning id into v_note_id;

  return v_note_id;
end;
$$;

revoke all on function public.send_dm_note(uuid, text, uuid) from public, anon;
grant execute on function public.send_dm_note(uuid, text, uuid) to authenticated;

-- mark_dm_note_read() — 수신자 본인만 자신에게 온 쪽지를 읽음 처리할 수 있다.
create or replace function public.mark_dm_note_read(p_note_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.dm_notes
  set read_at = now()
  where id = p_note_id
    and recipient_id = auth.uid()
    and read_at is null;
end;
$$;

revoke all on function public.mark_dm_note_read(uuid) from public, anon;
grant execute on function public.mark_dm_note_read(uuid) to authenticated;

-- hide_dm_note() — "나만 안 보이게" 소프트 삭제. 호출자가 발신자면 hidden_by_sender만,
-- 수신자면 hidden_by_recipient만 갱신해 상대방 쪽 사본에는 영향이 없다(방 나가기와 동일한
-- 개념 — 실제 행은 삭제하지 않는다).
create or replace function public.hide_dm_note(p_note_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  update public.dm_notes
  set
    hidden_by_sender = case when sender_id = v_uid then true else hidden_by_sender end,
    hidden_by_recipient = case when recipient_id = v_uid then true else hidden_by_recipient end
  where id = p_note_id
    and v_uid in (sender_id, recipient_id);
end;
$$;

revoke all on function public.hide_dm_note(uuid) from public, anon;
grant execute on function public.hide_dm_note(uuid) to authenticated;
