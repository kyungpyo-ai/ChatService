-- 종료 세션 아카이브를 지연 처리해 Realtime UPDATE 전달 문제를 해결 (Phase 5.5 보완)
-- 배경: end_random_session()이 status='ended'로 UPDATE한 직후 같은 호출 안에서 곧바로
-- random_session_archives로 옮기고 행을 삭제했다. Playwright로 재확인하니 이 경우 아직 대화
-- 화면에 남아있는 상대방에게 postgres_changes UPDATE 이벤트가 전달되지 않았다 — Supabase
-- Realtime은 RLS 기반 postgres_changes를 전달할 때 구독자가 그 행을 지금도 SELECT할 수 있는지
-- 재검증하는데, 이벤트를 처리하는 시점에 행이 이미 삭제되어 있으면 그 재검증이 실패해 이벤트
-- 자체가 조용히 드롭되는 것으로 보인다.
--
-- 해결: end_random_session()은 다시 상태만 'ended'로 바꾸고 끝낸다(행은 그대로 유지 —
-- Realtime이 전달할 시간을 준다). 아카이브+삭제는 별도 cron(1분 간격)이 "종료된 지 60초
-- 지난" 세션만 뒤늦게 정리한다. 60초면 실시간 전달에 충분하고, 짧아서 "종료된 URL을 다시
-- 방문하면 대화가 계속 보이는" 원래 문제(§ROADMAP)도 재현되지 않는다 — 그 사이 재방문해도
-- 이미 읽기 전용 "종료됨" 화면만 보이고 입력은 막혀 있다(app/(main)/random/[sessionId]/page.tsx
-- 가 status==='ended'를 이미 별도로 처리하고 있음).

create or replace function public.end_random_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.random_sessions
  set status = 'ended', ended_at = now(), ended_by = auth.uid()
  where id = p_session_id
    and status = 'active'
    and auth.uid() in (user_a_id, user_b_id);
end;
$$;

create or replace function public.archive_ended_random_sessions()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session record;
begin
  for v_session in
    select id from public.random_sessions
    where status = 'ended' and ended_at < now() - interval '60 seconds'
  loop
    insert into public.random_session_archives
      (original_session_id, user_a_id, user_b_id, started_at, ended_at, ended_by, messages)
    select
      rs.id, rs.user_a_id, rs.user_b_id, rs.started_at, rs.ended_at, rs.ended_by,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'sender_id', m.sender_id,
              'content', m.content,
              'content_type', m.content_type,
              'created_at', m.created_at
            )
            order by m.created_at
          )
          from public.messages m
          where m.session_id = rs.id
        ),
        '[]'::jsonb
      )
    from public.random_sessions rs
    where rs.id = v_session.id;

    delete from public.random_sessions where id = v_session.id;
  end loop;
end;
$$;

revoke all on function public.archive_ended_random_sessions() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'archive-ended-random-sessions') then
    perform cron.schedule(
      'archive-ended-random-sessions',
      '* * * * *',
      $job$select public.archive_ended_random_sessions()$job$
    );
  end if;
end;
$$;
