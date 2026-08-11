-- 방장/참여자 브라우저 종료를 거의 즉시 감지하도록 재설계 (2026-08-14)
--
-- 배경: close_room_if_owner_offline()이 실제 삭제 여부를 방장 하트비트 신선도(90초)로
-- 재검증하고 있었는데, 방채팅 하트비트 갱신 주기 자체가 60초라(§20260813000000) 최소
-- 90초 넘게 기다려야만 방이 종료됐다. 실사용 QA에서 "방장/참여자가 브라우저를 꺼도 한참
-- 뒤에야 반영된다"는 피드백을 받아, 서버 하트비트 재검증 대신 클라이언트가 Presence
-- leave 이벤트를 4초 디바운스(새로고침으로 인한 순간적 leave+rejoin만 살아남으면 충분)한
-- 뒤 호출하는 방식으로 안전장치를 옮긴다 — 이 프로젝트는 소규모 개인 서비스라, 멤버가
-- 이 호출을 악용해도(예: 실제로는 안 나갔는데 호출) 자기 자신이 속한 방 하나가 일찍
-- 종료되는 정도로 피해 범위가 작다는 점을 감안했다.
--
-- 겸사겸사 "방장이 나가면 방 종료" / "일반 참여자가 나가면 멤버십만 제거"를 하나의 함수로
-- 통합한다 — 대상이 방장인지 아닌지만 다를 뿐 로직 구조(호출자 멤버십 검증 → 대상별 처리)가
-- leave_room()과 동일하다. 참여자 쪽은 지금까지 자동 처리가 전혀 없었고(명시적 나가기/강퇴만
-- room_members를 지웠음), 이번에 처음 자동화된다.
create or replace function public.remove_offline_member(p_room_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.room_members
    where room_id = p_room_id and user_id = auth.uid()
  ) then
    raise exception 'not_a_member';
  end if;

  select owner_id into v_owner_id from public.rooms where id = p_room_id;

  if v_owner_id is null then
    return; -- 이미 삭제된 방
  end if;

  if v_owner_id = p_target_user_id then
    perform public.archive_and_delete_room(p_room_id);
  else
    delete from public.room_members where room_id = p_room_id and user_id = p_target_user_id;
  end if;
end;
$$;

revoke all on function public.remove_offline_member(uuid, uuid) from public, anon;
grant execute on function public.remove_offline_member(uuid, uuid) to authenticated;

-- close_room_if_owner_offline()은 remove_offline_member()로 완전히 대체되어 더 이상 쓰이지
-- 않는다.
drop function if exists public.close_room_if_owner_offline(uuid);
