-- Phase 7.5 §7.5.6 — 관리자 메시지 내용 검색
--
-- 날짜 범위는 함수 시그니처가 아니라 본문에서 명시적으로 거부한다(무제한 전체 스캔 경로 차단).
-- 진행 중 메시지는 부분 trgm 인덱스(§20260810070000)로 저렴하게, 아카이브는 날짜로 먼저 행을
-- 좁힌 뒤에만 jsonb_array_elements로 펼친다(§7.5.6 설계 노트).
create or replace function public.admin_search_messages(
  p_query text,
  p_date_from timestamptz,
  p_date_to timestamptz,
  p_scope text default 'all' -- 'active_rooms' | 'active_random' | 'archived_rooms' | 'archived_random' | 'all'
)
returns table (
  source text,           -- 'room' | 'random_session' | 'room_archive' | 'random_archive'
  context_id uuid,        -- 방/세션/아카이브 id (상세 화면 링크용)
  sender_id uuid,
  content text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;
  if p_date_from is null or p_date_to is null then
    raise exception 'date_range_required';
  end if;

  return query
  -- 진행 중인 방 메시지 (trgm 인덱스 활용)
  select 'room', m.room_id, m.sender_id, m.content, m.created_at
  from public.messages m
  where p_scope in ('all', 'active_rooms')
    and m.room_id is not null
    and m.content_type = 'text'
    and m.content ilike '%' || p_query || '%'
    and m.created_at between p_date_from and p_date_to

  union all

  -- 진행 중인 랜덤 세션 메시지
  select 'random_session', m.session_id, m.sender_id, m.content, m.created_at
  from public.messages m
  where p_scope in ('all', 'active_random')
    and m.session_id is not null
    and m.content_type = 'text'
    and m.content ilike '%' || p_query || '%'
    and m.created_at between p_date_from and p_date_to

  union all

  -- 종료된 방 아카이브 — 날짜로 먼저 행을 좁힌 뒤에만 jsonb 펼침
  select 'room_archive', ra.id, (elem->>'sender_id')::uuid,
         elem->>'content', (elem->>'created_at')::timestamptz
  from public.room_archives ra,
       jsonb_array_elements(ra.messages) elem
  where p_scope in ('all', 'archived_rooms')
    and ra.archived_at between p_date_from and p_date_to
    and elem->>'content_type' = 'text'
    and elem->>'content' ilike '%' || p_query || '%'

  union all

  -- 종료된 랜덤 세션 아카이브
  select 'random_archive', rsa.id, (elem->>'sender_id')::uuid,
         elem->>'content', (elem->>'created_at')::timestamptz
  from public.random_session_archives rsa,
       jsonb_array_elements(rsa.messages) elem
  where p_scope in ('all', 'archived_random')
    and rsa.archived_at between p_date_from and p_date_to
    and elem->>'content_type' = 'text'
    and elem->>'content' ilike '%' || p_query || '%'

  order by created_at desc
  limit 200;
end;
$$;

revoke all on function public.admin_search_messages(text, timestamptz, timestamptz, text) from public, anon;
grant execute on function public.admin_search_messages(text, timestamptz, timestamptz, text) to authenticated;
