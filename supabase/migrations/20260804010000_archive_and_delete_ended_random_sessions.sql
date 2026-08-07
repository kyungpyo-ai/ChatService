-- 랜덤채팅 종료 시 라이브 데이터 즉시 삭제 + 별도 아카이브 보관 (Phase 5 보완, 2026-08-04)
-- 배경: 대화가 끝나도 random_sessions/messages 행이 영구 보관되어, 종료된 세션 URL을 다시
-- 방문하면 대화 내용을 계속 볼 수 있었다(랜덤채팅의 "신원 비공개·일회성" 설계 의도 위반).
-- 해결: end_random_session()이 종료 처리 직후 해당 세션의 메시지를 jsonb 스냅샷으로
-- random_session_archives에 옮겨 담고, random_sessions 행을 삭제한다(messages는
-- session_id FK의 on delete cascade로 함께 삭제됨). 아카이브는 신고/분쟁 대응 등 운영 목적의
-- 내부 기록일 뿐이므로 참여자를 포함한 어떤 클라이언트 역할에도 조회 정책을 주지 않는다.
--
-- status='ended' UPDATE는 삭제 전에 먼저 커밋되므로, 이미 구독 중인 상대방의 Realtime
-- UPDATE 리스너(lib/realtime/random.ts)는 그대로 정상 동작한다.

create table public.random_session_archives (
  id uuid primary key default gen_random_uuid(),
  original_session_id uuid not null,
  user_a_id uuid not null,
  user_b_id uuid not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  ended_by uuid,
  messages jsonb not null default '[]'::jsonb,
  archived_at timestamptz not null default now()
);

create index random_session_archives_original_session_id_idx
  on public.random_session_archives (original_session_id);

alter table public.random_session_archives enable row level security;
-- 의도적으로 select/insert/update/delete 정책을 만들지 않는다 — RLS 기본값은 전체 거부이므로
-- authenticated/anon은 어떤 행도 조회할 수 없고, 오직 SECURITY DEFINER 함수만 기록한다.
revoke all on public.random_session_archives from public, anon, authenticated;

create or replace function public.end_random_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  update public.random_sessions
  set status = 'ended', ended_at = now(), ended_by = v_uid
  where id = p_session_id
    and status = 'active'
    and v_uid in (user_a_id, user_b_id);

  if not found then
    return;
  end if;

  insert into public.random_session_archives
    (original_session_id, user_a_id, user_b_id, started_at, ended_at, ended_by, messages)
  select
    rs.id,
    rs.user_a_id,
    rs.user_b_id,
    rs.started_at,
    rs.ended_at,
    rs.ended_by,
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
  where rs.id = p_session_id;

  -- messages는 messages_session_id_fkey의 on delete cascade로 함께 삭제된다.
  delete from public.random_sessions where id = p_session_id;
end;
$$;
