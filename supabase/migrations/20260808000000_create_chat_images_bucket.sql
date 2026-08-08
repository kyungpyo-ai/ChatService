-- 채팅 이미지 전송용 비공개 Storage 버킷 생성 (Phase 6, 2026-08-08)
-- 이 프로젝트의 첫 Storage 버킷이다 (avatars는 실제로는 생성된 적 없음 — profiles.avatar_url은
-- 외부 URL만 사용). 경로 규칙은 chat-images/rooms/{room_id}/{uuid}.{ext} 또는
-- chat-images/sessions/{session_id}/{uuid}.{ext} (§DEVELOPMENT_PLAN 6.1).
--
-- 비공개(public=false) 버킷이므로 조회는 반드시 서명 URL을 통해서만 가능하고, RLS 정책
-- (다음 마이그레이션)이 참여자 여부를 검증한다. file_size_limit/allowed_mime_types는
-- 버킷 레벨에서 Storage 서버가 강제하므로 클라이언트 검증을 우회해도 뚫리지 않는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-images',
  'chat-images',
  false,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
