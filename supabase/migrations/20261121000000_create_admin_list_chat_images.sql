-- 관리자 이미지 모아보기 (2026-11-21)
--
-- 방채팅/랜덤채팅에서 주고받은 이미지를 대화별로 일일이 열어보지 않고 한 화면에서 훑어볼 수
-- 있도록, 진행 중(messages) + 종료됨(room_archives / random_session_archives 스냅샷)에 있는
-- 이미지 메시지를 하나로 모아 최신순으로 반환한다. admin_search_messages와 동일하게
-- is_admin() 확인 후 SECURITY DEFINER로 RLS를 우회한다.
--
-- 날짜 필터는 아카이브도 archived_at이 아니라 "이미지를 보낸 시각"(elem.created_at) 기준이다 —
-- 이 화면은 대화가 아니라 이미지 단위로 보는 화면이기 때문.
-- 보낸 사람 이름: 회원은 profiles.username, 랜덤채팅 게스트(익명)는 '게스트', 탈퇴 등으로
-- 둘 다 없으면 null(화면에서 "알 수 없음"으로 표시).

create or replace function public.admin_list_chat_images(
  p_date_from timestamptz,
  p_date_to timestamptz,
  p_scope text default 'all',
  p_limit int default 60,
  p_offset int default 0
)
returns table(
  source text,
  context_id uuid,
  context_title text,
  sender_id uuid,
  sender_name text,
  path text,
  created_at timestamptz
)
language plpgsql
stable
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
  with images as (
    select 'room'::text as src, m.room_id as ctx, r.title as ctx_title,
           m.sender_id as sid, m.content as img_path, m.created_at as sent_at
    from public.messages m
    left join public.rooms r on r.id = m.room_id
    where p_scope in ('all', 'active_rooms')
      and m.room_id is not null
      and m.content_type = 'image'
      and m.created_at between p_date_from and p_date_to

    union all

    select 'random_session', m.session_id, null::text,
           m.sender_id, m.content, m.created_at
    from public.messages m
    where p_scope in ('all', 'active_random')
      and m.session_id is not null
      and m.content_type = 'image'
      and m.created_at between p_date_from and p_date_to

    union all

    select 'room_archive', ra.id, ra.title,
           (elem->>'sender_id')::uuid, elem->>'content', (elem->>'created_at')::timestamptz
    from public.room_archives ra,
         jsonb_array_elements(ra.messages) elem
    where p_scope in ('all', 'archived_rooms')
      and elem->>'content_type' = 'image'
      and (elem->>'created_at')::timestamptz between p_date_from and p_date_to

    union all

    select 'random_archive', rsa.id, null::text,
           (elem->>'sender_id')::uuid, elem->>'content', (elem->>'created_at')::timestamptz
    from public.random_session_archives rsa,
         jsonb_array_elements(rsa.messages) elem
    where p_scope in ('all', 'archived_random')
      and elem->>'content_type' = 'image'
      and (elem->>'created_at')::timestamptz between p_date_from and p_date_to
  )
  select i.src, i.ctx, i.ctx_title, i.sid,
         coalesce(p.username, case when g.id is not null then '게스트' end),
         i.img_path, i.sent_at
  from images i
  left join public.profiles p on p.id = i.sid
  left join public.guest_profiles g on g.id = i.sid
  order by i.sent_at desc
  limit least(greatest(p_limit, 1), 200)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.admin_list_chat_images(timestamptz, timestamptz, text, int, int) from public, anon;
grant execute on function public.admin_list_chat_images(timestamptz, timestamptz, text, int, int) to authenticated;
