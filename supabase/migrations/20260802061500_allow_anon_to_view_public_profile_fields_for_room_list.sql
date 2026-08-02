-- 게스트(비로그인)도 방 목록을 조회할 수 있어야 하는데(ROOM-01), profiles의 SELECT 정책이
-- authenticated로만 제한되어 있어 방장 프로필(닉네임/성별/나이)이 항상 null로 필터링되고
-- 그 결과 getRoomList()가 방을 통째로 걸러내던 문제 수정.
-- 이메일/실명/웹사이트 등 민감 필드는 노출하지 않도록 컬럼 단위로 grant를 제한한다.
create policy "public profile fields viewable by anon for room browsing"
  on public.profiles for select
  to anon
  using (true);

grant select (id, username, gender, age, avatar_url) on public.profiles to anon;
