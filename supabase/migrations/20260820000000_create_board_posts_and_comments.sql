-- Phase 12 — 게시판(사용자 커뮤니티 보드)
--
-- 목적: 사람찾기 / 건의사항 / 기타 태그로 분류된 글을 로그인 회원만 작성하고(§실사용 요청
-- 2026-08-20), 댓글을 달 수 있는 자유게시판. 비로그인/게스트도 읽기는 가능하다(rooms 목록과
-- 동일한 공개 열람 모델). 신고는 새 테이블을 따로 만들지 않고 기존 reports 시스템의
-- target_type을 'post'/'comment'로 확장해서 그대로 재사용한다.
--
-- 삭제는 하드 delete가 아니라 is_deleted 플래그로 처리한다 — 신고된 글/댓글을 작성자가
-- "삭제"해도 관리자가 신고 상세에서 원문을 계속 확인할 수 있어야 하기 때문이다(방/신고 처리
-- 화면과 동일한 요구사항).

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  tag text not null check (tag in ('find_user', 'suggestion', 'etc')),
  title text not null check (char_length(title) between 1 and 100),
  content text not null check (char_length(content) between 1 and 5000),
  view_count integer not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_created_idx on public.posts (created_at desc) where not is_deleted;
create index posts_tag_created_idx on public.posts (tag, created_at desc) where not is_deleted;

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default now()
);

create index post_comments_post_idx on public.post_comments (post_id, created_at asc);

alter table public.posts enable row level security;
alter table public.post_comments enable row level security;

-- 목록/상세는 게스트 포함 누구나 볼 수 있다(rooms 목록과 동일한 공개 열람 모델) — 단
-- 삭제된 글은 관리자만 계속 볼 수 있어야 신고 검토가 가능하다.
create policy "anyone can view non-deleted posts"
  on public.posts for select
  to anon, authenticated
  using (not is_deleted or public.is_admin());

create policy "anyone can view non-deleted comments"
  on public.post_comments for select
  to anon, authenticated
  using (not is_deleted or public.is_admin());

-- 쓰기는 전부 SECURITY DEFINER 함수를 통해서만 — 게스트 차단, 정지 계정 차단, 작성자 본인만
-- 삭제 가능 같은 검증을 클라이언트가 우회할 수 없게 한다(send_dm_note류 기존 패턴과 동일).
revoke insert, update, delete on public.posts from authenticated;
revoke insert, update, delete on public.post_comments from authenticated;

-- 게시글 댓글 수 — room_member_count와 동일한 SECURITY DEFINER computed-column 패턴.
create or replace function public.post_comment_count(p public.posts)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) from public.post_comments where post_id = p.id and not is_deleted;
$$;

revoke execute on function public.post_comment_count(public.posts) from public;
grant execute on function public.post_comment_count(public.posts) to anon, authenticated;

create or replace function public.create_post(p_tag text, p_title text, p_content text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_title text := trim(p_title);
  v_content text := trim(p_content);
  v_post_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'guest_cannot_post';
  end if;

  if public.is_user_suspended(v_uid) then
    raise exception 'user_suspended';
  end if;

  if v_title = '' or v_content = '' then
    raise exception 'empty_content';
  end if;

  insert into public.posts (author_id, tag, title, content)
  values (v_uid, p_tag, v_title, v_content)
  returning id into v_post_id;

  return v_post_id;
end;
$$;

revoke all on function public.create_post(text, text, text) from public, anon;
grant execute on function public.create_post(text, text, text) to authenticated;

-- 삭제는 작성자 본인 또는 관리자만 가능 — 하드 delete가 아니라 is_deleted 플래그(위 설명 참고).
create or replace function public.delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.posts
  set is_deleted = true
  where id = p_post_id
    and (author_id = v_uid or public.is_admin());
end;
$$;

revoke all on function public.delete_post(uuid) from public, anon;
grant execute on function public.delete_post(uuid) to authenticated;

create or replace function public.increment_post_view_count(p_post_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.posts set view_count = view_count + 1 where id = p_post_id and not is_deleted;
$$;

revoke all on function public.increment_post_view_count(uuid) from public, anon;
grant execute on function public.increment_post_view_count(uuid) to anon, authenticated;

create or replace function public.create_post_comment(p_post_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_content text := trim(p_content);
  v_comment_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'guest_cannot_post';
  end if;

  if public.is_user_suspended(v_uid) then
    raise exception 'user_suspended';
  end if;

  if v_content = '' then
    raise exception 'empty_content';
  end if;

  if not exists (select 1 from public.posts where id = p_post_id and not is_deleted) then
    raise exception 'post_not_found';
  end if;

  insert into public.post_comments (post_id, author_id, content)
  values (p_post_id, v_uid, v_content)
  returning id into v_comment_id;

  return v_comment_id;
end;
$$;

revoke all on function public.create_post_comment(uuid, text) from public, anon;
grant execute on function public.create_post_comment(uuid, text) to authenticated;

create or replace function public.delete_post_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  update public.post_comments
  set is_deleted = true
  where id = p_comment_id
    and (author_id = v_uid or public.is_admin());
end;
$$;

revoke all on function public.delete_post_comment(uuid) from public, anon;
grant execute on function public.delete_post_comment(uuid) to authenticated;

-- 기존 신고 시스템(§Phase 7.5.3)에 게시글/댓글 신고 대상을 추가한다.
alter table public.reports drop constraint reports_target_type_check;
alter table public.reports add constraint reports_target_type_check
  check (target_type in ('room', 'random_session', 'message', 'user', 'post', 'comment'));
