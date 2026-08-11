-- archive_and_delete_room() 중복 아카이브 버그 수정 (2026-08-14)
--
-- 배경: 20260808040000에서 이미 rooms에 BEFORE DELETE 트리거(archive_room_before_delete)를
-- 달아 "삭제되기 직전 행을 무조건 아카이브에 남긴다"를 테이블 레벨에서 보장하도록 리팩터링
--했고, 그 뒤로 leave_room()은 delete만 호출한다(수동 INSERT 없음, 트리거가 유일한 아카이브
-- 경로). 그런데 20260814000000에서 archive_and_delete_room()을 새로 만들면서 이 사실을 놓치고
-- 트리거 도입 이전(20260807010000) 버전의 "수동 INSERT → DELETE" 패턴을 그대로 가져왔다.
-- 그 결과 DELETE가 트리거를 발동시키면서 room_archives에 동일 스냅샷이 매번 2행씩 쌓였다
-- (실제로 배포 직후 데이터 정리 단계와 수동 QA에서 중복 발생을 확인함, 아래에서 정리).
--
-- 수정: 수동 INSERT를 제거하고 DELETE만 남긴다 — 이제 archive_and_delete_room()은 leave_room()의
-- 방장 분기와 동일하게 트리거에 아카이브를 위임한다. 부수 효과로, 여러 트랜잭션이 같은 방을
-- 동시에 삭제하려는 경우도 DELETE 자체가 행 잠금 역할을 해 자연히 한쪽만 실제로 삭제·아카이브
-- 되고 나머지는 0행 삭제로 조용히 끝난다(SELECT ... FOR UPDATE를 별도로 걸 필요가 없어짐).
create or replace function public.archive_and_delete_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.rooms where id = p_room_id;
end;
$$;

-- 위 버그로 배포 직후 데이터 정리 단계와 QA 과정에서 실제로 생긴 중복 아카이브 행을 정리한다.
-- 같은 원본 방(original_room_id)에 대해 archived_at까지 완전히 같은 행이 여러 개인 경우
-- 하나만 남긴다.
delete from public.room_archives a
using public.room_archives b
where a.ctid < b.ctid
  and a.original_room_id = b.original_room_id
  and a.archived_at = b.archived_at;
