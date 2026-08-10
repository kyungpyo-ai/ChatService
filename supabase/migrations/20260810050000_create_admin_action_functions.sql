-- Phase 7.5 §7.5.5 — 관리자 조치 SECURITY DEFINER 함수 모음
--
-- 각 함수 마지막에 admin_audit_logs INSERT(§7.5.6 아님, §7.5.3 스키마 참고)로 조치를 기록한다.
-- admin_log_action()은 audit log 기록 전용 공용 헬퍼 — DB 함수로 표현하기 어려운 조치
-- (계정 강제 탈퇴는 auth.admin.deleteUser Admin API를 서버 액션에서 호출해야 하므로 SQL
-- 함수가 아니다, §7.5.5)까지 동일한 감사 로그 경로를 쓰기 위해 별도로 둔다.
create or replace function public.admin_log_action(
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_detail jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_detail);
end;
$$;

-- 방 강제 삭제 — BEFORE DELETE 트리거(archive_room_before_delete, §Phase 7)가 자동으로
-- room_archives에 스냅샷을 남기므로 이 함수는 삭제 + 감사 로그 기록만 하면 된다.
create or replace function public.admin_force_delete_room(p_room_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  delete from public.rooms where id = p_room_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), 'force_delete_room', 'room', p_room_id, jsonb_build_object('reason', p_reason));
end;
$$;

-- 랜덤채팅 세션 강제 종료 — 방 강제 삭제와 대응되는 랜덤채팅 쪽 조치. 기존 end_random_session()과
-- 동일하게 상태만 'ended'로 바꾸고 즉시 삭제하지 않는다 — 실제 삭제/아카이브는 기존
-- archive_ended_random_sessions() cron이 60초 뒤 처리하는 흐름에 그대로 편승한다(§7.5.5).
create or replace function public.admin_force_end_random_session(p_session_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  update public.random_sessions
  set status = 'ended', ended_at = now(), ended_by = auth.uid()
  where id = p_session_id and status = 'active';

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), 'force_end_random_session', 'random_session', p_session_id, jsonb_build_object('reason', p_reason));
end;
$$;

-- 계정 정지 — 로그인·조회는 막지 않고, §20260810060000에서 추가하는 행위별 체크만 거부한다.
create or replace function public.admin_suspend_user(
  p_user_id uuid,
  p_reason text,
  p_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  update public.profiles
  set suspended_at = now(), suspended_until = p_until, suspended_reason = p_reason
  where id = p_user_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, detail)
  values (
    auth.uid(), 'suspend_user', 'user', p_user_id,
    jsonb_build_object('reason', p_reason, 'until', p_until)
  );
end;
$$;

-- 정지 해제 — 행 삭제 대신 suspended_until = now()로 갱신해 정지 이력은 남긴다.
create or replace function public.admin_unsuspend_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  update public.profiles
  set suspended_until = now()
  where id = p_user_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), 'unsuspend_user', 'user', p_user_id, null);
end;
$$;

-- 신고 처리 완료 — 조치(강제 삭제·정지)는 관리자가 먼저 별도 버튼으로 실행한 뒤, 이 함수로
-- 신고 자체를 닫는 2단계 흐름이다(§7.5.5, 오탐 신고로 즉시 삭제되는 사고 방지).
create or replace function public.admin_resolve_report(p_report_id uuid, p_action_taken text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  update public.reports
  set status = 'resolved', reviewed_by = auth.uid(), reviewed_at = now(), action_taken = p_action_taken
  where id = p_report_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), 'resolve_report', 'report', p_report_id, jsonb_build_object('action_taken', p_action_taken));
end;
$$;

create or replace function public.admin_dismiss_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;

  update public.reports
  set status = 'dismissed', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_report_id;

  insert into public.admin_audit_logs (admin_id, action, target_type, target_id, detail)
  values (auth.uid(), 'dismiss_report', 'report', p_report_id, null);
end;
$$;

revoke all on function public.admin_log_action(text, text, uuid, jsonb) from public, anon;
revoke all on function public.admin_force_delete_room(uuid, text) from public, anon;
revoke all on function public.admin_force_end_random_session(uuid, text) from public, anon;
revoke all on function public.admin_suspend_user(uuid, text, timestamptz) from public, anon;
revoke all on function public.admin_unsuspend_user(uuid) from public, anon;
revoke all on function public.admin_resolve_report(uuid, text) from public, anon;
revoke all on function public.admin_dismiss_report(uuid) from public, anon;

grant execute on function public.admin_log_action(text, text, uuid, jsonb) to authenticated;
grant execute on function public.admin_force_delete_room(uuid, text) to authenticated;
grant execute on function public.admin_force_end_random_session(uuid, text) to authenticated;
grant execute on function public.admin_suspend_user(uuid, text, timestamptz) to authenticated;
grant execute on function public.admin_unsuspend_user(uuid) to authenticated;
grant execute on function public.admin_resolve_report(uuid, text) to authenticated;
grant execute on function public.admin_dismiss_report(uuid) to authenticated;
