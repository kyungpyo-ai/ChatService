-- messages.session_id에 random_sessions FK를 추가하고, 세션 참여자를 위한 SELECT/INSERT RLS 정책을
-- 추가한다. Phase 3(20260726125444_create_messages_table.sql) 시점엔 random_sessions 테이블이
-- 아직 없어 FK 없이 컬럼만 만들어뒀던 부분을 이번 Phase에서 마무리한다.
-- INSERT 정책은 rs.status = 'active' 조건을 포함해 종료된 세션에는 메시지를 못 보내게 막는다(RND-05).

alter table public.messages
  add constraint messages_session_id_fkey
  foreign key (session_id) references public.random_sessions(id) on delete cascade;

create policy "session participants can view session messages"
  on public.messages for select
  to authenticated
  using (
    session_id is not null and exists (
      select 1 from public.random_sessions rs
      where rs.id = messages.session_id and auth.uid() in (rs.user_a_id, rs.user_b_id)
    )
  );

create policy "session participants can send session messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and session_id is not null
    and exists (
      select 1 from public.random_sessions rs
      where rs.id = messages.session_id
        and rs.status = 'active'
        and auth.uid() in (rs.user_a_id, rs.user_b_id)
    )
  );
