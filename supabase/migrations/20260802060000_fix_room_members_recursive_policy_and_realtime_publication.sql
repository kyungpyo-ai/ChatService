-- room_members SELECT 정책이 자기 자신을 서브쿼리로 참조해 infinite recursion을 유발하던 문제 수정.
-- SECURITY DEFINER 함수로 우회해 정책 평가 시 재귀 트리거를 피한다.
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = auth.uid()
  );
$$;

revoke execute on function public.is_room_member(uuid) from public, anon;
grant execute on function public.is_room_member(uuid) to authenticated;

drop policy "members can view their room roster" on public.room_members;

create policy "members can view their room roster"
  on public.room_members for select
  to authenticated
  using (public.is_room_member(room_id));

-- messages 테이블이 supabase_realtime publication에 등록되어 있지 않아 postgres_changes 구독이 전혀 동작하지 않던 문제 수정.
alter publication supabase_realtime add table public.messages;
