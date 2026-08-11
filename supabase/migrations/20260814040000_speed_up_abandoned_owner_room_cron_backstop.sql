-- 방장 혼자 있는 방의 cron 백스톱 속도 개선 (2026-08-14)
--
-- 배경: 잔류 멤버가 있으면 Presence로 1.5초 안에 감지되지만(§remove_offline_member,
-- 20260814030000), 방장 혼자 있던 방은 지켜봐줄 멤버가 없어 cron 백스톱(기존 1분 주기,
-- 3분 임계값)에만 의존한다. 실사용 QA에서 "방장 혼자 있다가 나가면 방이 안 지워진다"는
-- 피드백을 받았는데, 실제로는 지워지긴 하지만 최대 4분(1분 주기 오차 + 3분 임계값)까지
-- 걸릴 수 있어 체감상 "안 지워진다"로 보인 것이다.
--
-- 해결: 방채팅 하트비트 주기를 60초→15초로 줄였으므로(§lib/hooks/use-room-heartbeat.ts)
-- 임계값도 15초의 3배인 45초로 낮추고, cron 주기도 pg_cron의 초 단위 스케줄링을 활용해
-- 1분→30초로 앞당긴다. 최악의 경우에도 약 75초 안에는 정리된다(기존 최대 4분에서 대폭 단축).
create or replace function public.close_abandoned_owner_rooms()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room record;
begin
  for v_room in
    select r.id
    from public.rooms r
    join public.profiles p on p.id = r.owner_id
    where coalesce(
      case when p.room_heartbeat_room_id = r.id then p.room_heartbeat_at else null end,
      r.created_at
    ) < now() - interval '45 seconds'
  loop
    perform public.archive_and_delete_room(v_room.id);
  end loop;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'close-abandoned-owner-rooms') then
    perform cron.unschedule('close-abandoned-owner-rooms');
  end if;

  perform cron.schedule(
    'close-abandoned-owner-rooms',
    '30 seconds',
    $job$select public.close_abandoned_owner_rooms()$job$
  );
end;
$$;
