-- 아카이브 보존 기한 90일 → 30일 단축 (2026-08-07)
-- 배경: 신고 대응 목적상 90일은 과하다고 판단 — 실제 신고는 보통 대화 종료 후 며칠~2주 내에
-- 들어오므로, 30일이면 대응 목적은 거의 그대로 충족하면서 장기적으로 누적량을 1/3로 줄인다.

create or replace function public.cleanup_old_random_session_archives()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.random_session_archives where archived_at < now() - interval '30 days';
$$;

create or replace function public.cleanup_old_room_archives()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.room_archives where archived_at < now() - interval '30 days';
$$;
