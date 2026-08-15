-- 아바타 이미지용 공개 Storage 버킷 생성 (§profile-edit-form 아바타 파일 업로드)
--
-- chat-images는 참여자만 봐야 해서 비공개+서명URL이지만, 아바타는 다른 사용자들도 항상
-- 봐야 하므로(방채팅 목록, 검색 결과, 메시지 등) 공개(public) 버킷으로 만들어 서명 URL
-- 재발급 부담을 없앤다.
--
-- 경로 규칙: avatars/{user_id}.{ext} — 사용자당 파일 1개만 존재하도록 고정한다.
-- 재업로드는 upsert로 같은 경로를 덮어쓰므로 이전 파일을 별도로 정리할 필요가 없다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 공개 버킷이므로 누구나(비로그인 포함) 아바타를 조회할 수 있다.
create policy "avatar images are publicly accessible"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

-- INSERT/UPDATE/DELETE는 본인 경로(avatars/{user_id}.{ext})만 허용한다.
-- 경로에 하위 폴더가 없는 평평한 구조이므로 storage.foldername이 아니라 파일명 자체에서
-- 확장자를 뗀 부분이 auth.uid()와 일치하는지로 검증한다.
create policy "users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '.', 1) = auth.uid()::text
  );

create policy "users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '.', 1) = auth.uid()::text
  );

create policy "users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '.', 1) = auth.uid()::text
  );
