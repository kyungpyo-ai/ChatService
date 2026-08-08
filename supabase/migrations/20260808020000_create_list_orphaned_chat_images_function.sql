-- 고아 채팅 이미지 목록 조회 함수 (Phase 6, 2026-08-08)
--
-- "고아"의 정의: chat-images 버킷의 오브젝트 중, 다음 세 곳 어디에서도 그 경로(storage.objects.name,
-- 예: 'rooms/{room_id}/{uuid}.png')를 참조하는 행이 전혀 없는 것.
--   1) public.messages — 살아있는 방/세션의 정상 이미지 메시지 (content_type='image', content=경로)
--   2) public.room_archives.messages — 방 삭제 시 jsonb 배열로 스냅샷된 메시지 기록
--      (각 원소가 {"sender_id", "content", "content_type", "created_at"} 형태, 20260807010000)
--   3) public.random_session_archives.messages — 세션 종료 시 동일한 jsonb 배열 스냅샷 형태
--      (20260804010000)
-- 세 테이블 모두 원본 메시지의 content_type/content를 그대로 옮겨 담으므로, 이미지 메시지라면
-- content_type='image' + content=경로 조합이 그대로 보존되어 있다 — 이 조건으로 정확히
-- 판별 가능하다(추측이 아니라 실제 저장 스키마 확인 결과).
--
-- ⚠️ 가장 중요한 안전장치: 방금 업로드됐지만 아직 messages INSERT 전인 파일(업로드→INSERT
-- 사이의 경쟁 상태)이 고아로 오인되지 않도록, 생성 후 1시간이 지나지 않은 오브젝트는 아예
-- 후보에서 제외한다. 살아있는 방/세션의 정상 이미지는 위 1)에서 항상 걸러지므로 목록에
-- 섞일 수 없다.
create or replace function public.list_orphaned_chat_images()
returns setof text
language sql
security definer
set search_path = ''
stable
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'chat-images'
    and o.created_at < now() - interval '1 hour'
    and not exists (
      select 1 from public.messages m
      where m.content_type = 'image' and m.content = o.name
    )
    and not exists (
      select 1
      from public.room_archives ra
      cross join lateral jsonb_array_elements(ra.messages) as elem
      where elem ->> 'content_type' = 'image'
        and elem ->> 'content' = o.name
    )
    and not exists (
      select 1
      from public.random_session_archives rsa
      cross join lateral jsonb_array_elements(rsa.messages) as elem
      where elem ->> 'content_type' = 'image'
        and elem ->> 'content' = o.name
    );
$$;

-- 클라이언트 역할은 직접 호출할 수 없고, 정리 배치(app/api/cron/cleanup-chat-images)가
-- 서비스 롤 키로만 호출한다(서비스 롤은 GRANT/REVOKE와 무관하게 RLS·권한을 우회함).
revoke all on function public.list_orphaned_chat_images() from public, anon, authenticated;
