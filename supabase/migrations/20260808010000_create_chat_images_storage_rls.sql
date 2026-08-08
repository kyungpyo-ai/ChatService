-- chat-images 버킷 RLS 정책 (Phase 6, 2026-08-08)
--
-- 경로 규칙: rooms/{room_id}/{uuid}.{ext} 또는 sessions/{session_id}/{uuid}.{ext}
-- storage.foldername(name)은 파일명을 제외한 디렉터리 세그먼트 배열을 반환한다
-- (예: 'rooms/11111111-1111-1111-1111-111111111111/abc.png' → {rooms, 11111111-...}).
--
-- ⚠️ Phase 3에서 room_members SELECT 정책이 자기 자신을 서브쿼리해 infinite recursion이
-- 터진 전례가 있어(20260802060000), room 참여자 검증은 반드시 기존 SECURITY DEFINER 함수
-- public.is_room_member()를 재사용하고 room_members를 직접 서브쿼리하지 않는다.
--
-- ⚠️ 랜덤채팅 참여자는 Supabase 익명(anonymous) 로그인 사용자다. 익명 로그인 사용자도
-- Postgres 역할상 'authenticated'로 분류되고 auth.uid()가 정상적으로 채워지므로
-- (random_queue/random_sessions 등 기존 정책과 동일하게) `to authenticated`만으로
-- 게스트를 배제하지 않는다.
--
-- 두 번째 세그먼트가 uuid 형식인지 정규식으로 먼저 확인한 뒤에만 ::uuid로 캐스팅한다 —
-- 형식이 깨진 경로에 대해 캐스팅 에러가 나면 그 행뿐 아니라 정책 평가 자체가 실패할 수 있어
-- 방어적으로 가드를 둔다.
--
-- UPDATE/DELETE 정책은 의도적으로 만들지 않는다 — 참여자라도 이미지를 수정/삭제할 수 없어야
-- 하므로 RLS 기본값(전체 거부)을 그대로 둔다.

create policy "chat image participants can view"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'chat-images'
    and (
      (
        (storage.foldername(name))[1] = 'rooms'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_room_member(((storage.foldername(name))[2])::uuid)
      )
      or (
        (storage.foldername(name))[1] = 'sessions'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and exists (
          select 1 from public.random_sessions rs
          where rs.id = ((storage.foldername(name))[2])::uuid
            and auth.uid() in (rs.user_a_id, rs.user_b_id)
        )
      )
    )
  );

-- INSERT: 조회와 동일한 참여자 조건 + 업로드 시점에 방/세션이 "살아있을" 것.
-- 방은 rooms 행이 존재하는 한(=삭제되지 않은 한) is_room_member()가 room_members를 통해
-- 참여자 여부를 검증하므로 별도의 생존 조건이 필요 없다(방이 삭제되면 room_members도
-- cascade로 함께 사라져 is_room_member()가 false를 반환한다). 세션은 status='active'를
-- 명시적으로 확인해 종료된 세션에는 업로드를 막는다(메시지 INSERT 정책과 동일한 원칙).
create policy "chat image participants can upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-images'
    and (
      (
        (storage.foldername(name))[1] = 'rooms'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and public.is_room_member(((storage.foldername(name))[2])::uuid)
      )
      or (
        (storage.foldername(name))[1] = 'sessions'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and exists (
          select 1 from public.random_sessions rs
          where rs.id = ((storage.foldername(name))[2])::uuid
            and rs.status = 'active'
            and auth.uid() in (rs.user_a_id, rs.user_b_id)
        )
      )
    )
  );
