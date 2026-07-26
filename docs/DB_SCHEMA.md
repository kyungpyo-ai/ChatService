# 수다온(sudaon) DB 스키마

> `ARCHITECTURE.md`에서 정한 구조를 실제 테이블/함수/RLS 정책으로 구체화한 문서다. 여기 정의된 내용은 설계 기준이며, 실제 마이그레이션 파일은 `DEVELOPMENT_PLAN.md`의 해당 태스크에서 Supabase MCP로 생성/적용한다. 기존 `profiles` 테이블(`supabase/migrations/20260726000000_create_profiles_table.sql`)은 재사용하되 1건의 변경이 필요하다 (§1).

---

## 0. 테이블 목록 개요

| 테이블 | 용도 | 신규/변경 |
|---|---|---|
| `profiles` | 회원+게스트 공통 프로필 | 변경 (컬럼 추가) |
| `rooms` | 방 정보 | 신규 |
| `room_members` | 방 참여자 | 신규 |
| `room_bans` | 강퇴 이력 (재입장 차단) | 신규 |
| `random_queue` | 랜덤채팅 대기열 | 신규 |
| `random_sessions` | 랜덤채팅 1:1 세션 | 신규 |
| `messages` | 방채팅·랜덤채팅 공통 메시지 | 신규 |

---

## 1. 기존 테이블 변경 — `profiles`

`ARCHITECTURE.md` §2.2 결정(게스트 = Supabase 익명 인증)에 따라, 익명 로그인 사용자도 `auth.users` INSERT 트리거(`handle_new_user`)를 통해 `profiles` 행이 자동 생성된다. 회원과 게스트를 구분할 수 있도록 컬럼을 추가한다.

```sql
alter table public.profiles
  add column is_anonymous boolean not null default false,
  add column last_seen_at timestamptz not null default now();

-- 닉네임 부분 검색용 trigram 인덱스
create extension if not exists pg_trgm;

create index profiles_username_trgm_idx
  on public.profiles using gin (username gin_trgm_ops);

-- handle_new_user() 트리거 함수 수정: new.is_anonymous 값을 그대로 기록
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, is_anonymous)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.is_anonymous, false)
  );
  return new;
end;
$$;
```

- 게스트 닉네임: 익명 계정은 `setup-profile` 플로우를 타지 않으므로 `full_name`이 비어 있을 수 있다. 화면 표시용 닉네임은 클라이언트에서 "익명" + 임의 번호로 대체 표시(DB 저장 불필요).
- `username`(unique) 제약은 게스트에는 적용하지 않음 — NULL 허용 유지(기존과 동일, `unique` 제약은 NULL 다중 허용).
- `last_seen_at`: 로그인 세션 동안 클라이언트가 주기적으로 갱신하는 하트비트 컬럼. 온라인 여부 계산 방식은 `ARCHITECTURE.md` §5.2 참고.

---

## 2. 사용자 검색 관련 정책

`profiles` 테이블은 기존에 이미 `select` 정책이 `to authenticated using (true)`로 열려 있어(모든 회원이 모든 프로필 조회 가능), 검색 자체를 위한 RLS 추가 변경은 필요 없다. 대신 쿼리 단에서 아래 조건을 강제한다.

```sql
-- 애플리케이션(서버 액션/쿼리 레이어)에서 사용하는 검색 쿼리 형태 예시
select id, username, full_name, avatar_url, last_seen_at
from public.profiles
where is_anonymous = false
  and username ilike '%' || $1 || '%'
order by username
limit 20;
```

- `is_anonymous = false` 조건으로 게스트 계정을 검색 대상에서 제외 (SEARCH-03)
- 검색은 Route Handler/Server Action에서 로그인 사용자(`auth.uid()` 존재)만 호출하도록 애플리케이션 레벨에서 제어 (SEARCH-01) — `profiles` select 정책이 `to authenticated`로 이미 비로그인(anon) 접근을 차단하므로 이중으로 보장됨
- `last_seen_at`과 임계값(예: 2분)을 비교해 온라인 여부를 애플리케이션에서 계산 (DB 컬럼으로 별도 저장하지 않음)

---

## 3. `rooms`

```sql
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 50),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  max_members smallint not null check (max_members between 2 and 50),
  is_private boolean not null default false,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint password_hash_required_if_private
    check (is_private = false or password_hash is not null)
);

create index rooms_created_at_idx on public.rooms (created_at desc);

alter table public.rooms enable row level security;

-- 방 목록은 비로그인 포함 누구나 조회 가능 (PRD ROOM-01)
create policy "rooms are viewable by everyone"
  on public.rooms for select
  to anon, authenticated
  using (true);

-- 생성은 로그인 회원만 (익명 계정 제외), 본인을 owner로만 생성 가능
create policy "authenticated users can create rooms"
  on public.rooms for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    and not exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.is_anonymous
    )
  );

-- password_hash는 컬럼 단위로 노출 차단 (RLS는 행 단위이므로 별도 REVOKE 필요)
revoke select (password_hash) on public.rooms from anon, authenticated;
```

- `ROOM-02`(입장/생성은 로그인만): insert 정책에서 `is_anonymous` 회원은 방 생성 불가로 명시. 방 입장은 `join_room()` 함수(§6)에서 재검증.
- 비밀번호는 애플리케이션에서 해시(bcrypt 등) 후 저장, 원문 비교 금지(§ARCHITECTURE 8).

---

## 4. `room_members`

```sql
create table public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

create index room_members_room_id_idx on public.room_members (room_id);

alter table public.room_members enable row level security;

-- 같은 방 참여자만 참여자 목록 조회 가능
create policy "members can view their room roster"
  on public.room_members for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members me
      where me.room_id = room_members.room_id and me.user_id = auth.uid()
    )
  );

-- 입장/강퇴는 SECURITY DEFINER 함수(join_room, kick_member)를 통해서만 수행
-- 클라이언트의 직접 INSERT/DELETE는 차단
revoke insert, update, delete on public.room_members from authenticated;
```

참여자 추가/제거는 전부 §6의 함수를 통해서만 이루어지도록 강제해, 정원 체크·강퇴 이력 체크를 우회할 수 없게 한다.

---

## 5. `room_bans`

강퇴된 사용자의 재입장을 막기 위한 이력 테이블 (ROOM-07).

```sql
create table public.room_bans (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  banned_by uuid not null references public.profiles(id),
  banned_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.room_bans enable row level security;

-- 방장만 자신의 방에 대한 강퇴 이력 조회 가능 (일반 참여자는 불필요)
create policy "room owner can view bans"
  on public.room_bans for select
  to authenticated
  using (
    exists (
      select 1 from public.rooms r where r.id = room_bans.room_id and r.owner_id = auth.uid()
    )
  );

revoke insert, update, delete on public.room_bans from authenticated;
```

---

## 6. `random_queue` / `random_sessions`

```sql
create table public.random_queue (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  queued_at timestamptz not null default now()
);

alter table public.random_queue enable row level security;

create policy "users can view own queue row"
  on public.random_queue for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.random_queue from authenticated;

create table public.random_sessions (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  ended_by uuid references public.profiles(id),
  check (user_a_id <> user_b_id)
);

create index random_sessions_participants_idx on public.random_sessions (user_a_id, user_b_id);

alter table public.random_sessions enable row level security;

create policy "participants can view their session"
  on public.random_sessions for select
  to authenticated
  using (auth.uid() in (user_a_id, user_b_id));

revoke insert, update, delete on public.random_sessions from authenticated;
```

- `random_queue`는 회원/게스트(익명 계정 포함) 모두 `auth.uid()`만 있으면 참여 가능 (RND-01).
- 큐/세션에 대한 쓰기는 전부 §6의 `match_or_wait()`, `end_random_session()` 함수를 통해서만 수행.

---

## 7. `messages` (방채팅·랜덤채팅 공통)

```sql
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.rooms(id) on delete cascade,
  session_id uuid references public.random_sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  content_type text not null check (content_type in ('text', 'image')),
  content text not null,
  created_at timestamptz not null default now(),
  constraint exactly_one_context check (
    (room_id is not null and session_id is null)
    or (room_id is null and session_id is not null)
  )
);

create index messages_room_id_created_at_idx on public.messages (room_id, created_at);
create index messages_session_id_created_at_idx on public.messages (session_id, created_at);

alter table public.messages enable row level security;

create policy "room participants can view room messages"
  on public.messages for select
  to authenticated
  using (
    room_id is not null and exists (
      select 1 from public.room_members rm
      where rm.room_id = messages.room_id and rm.user_id = auth.uid()
    )
  );

create policy "session participants can view session messages"
  on public.messages for select
  to authenticated
  using (
    session_id is not null and exists (
      select 1 from public.random_sessions rs
      where rs.id = messages.session_id and auth.uid() in (rs.user_a_id, rs.user_b_id)
    )
  );

create policy "room participants can send room messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and room_id is not null
    and exists (
      select 1 from public.room_members rm
      where rm.room_id = messages.room_id and rm.user_id = auth.uid()
    )
  );

create policy "session participants can send session messages"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and session_id is not null
    and exists (
      select 1 from public.random_sessions rs
      where rs.id = messages.session_id
        and rs.status = 'active'
        and auth.uid() in (rs.user_a_id, rs.user_b_id)
    )
  );
```

- `content`: `content_type = 'text'`면 메시지 본문, `'image'`면 Storage 경로(§ARCHITECTURE 7의 `chat-images/{room_id 또는 session_id}/{uuid}.{ext}`)를 저장.
- 이미지 형식/용량 검증은 DB 제약이 아닌 서버 액션에서 업로드 전에 수행 (§ARCHITECTURE 8).

---

## 8. SECURITY DEFINER 함수

클라이언트가 테이블에 직접 쓰지 못하도록 막고, 아래 함수들을 통해서만 상태를 변경한다. 모든 함수는 `security definer` + `set search_path = ''`로 작성하고, 내부에서 `auth.uid()`로 호출자를 식별한다.

| 함수 | 역할 | 대응 요구사항 |
|---|---|---|
| `join_room(p_room_id uuid, p_password text)` | 정원 확인 → 강퇴 이력 확인 → 비밀번호 해시 검증 → `room_members` INSERT | ROOM-02, ROOM-03, ROOM-04, ROOM-07 |
| `kick_member(p_room_id uuid, p_target_user_id uuid)` | 호출자가 해당 방 `owner_id`인지 재검증 → `room_members` DELETE → `room_bans` INSERT | ROOM-06 |
| `match_or_wait()` | `random_queue`를 `FOR UPDATE SKIP LOCKED`로 조회 → 대기 상대 있으면 `random_sessions` 생성 후 큐 제거, 없으면 큐에 등록 | RND-01~03 |
| `end_random_session(p_session_id uuid)` | 호출자가 세션 참여자인지 확인 → `status = 'ended'`, `ended_by` 기록 | RND-05 |
| `cancel_random_queue()` | 호출자 본인의 `random_queue` 행 삭제 | RND-05 |

계정 탈퇴(AUTH-02)는 DB 함수가 아니라 **서버 액션에서 Supabase Admin API(`auth.admin.deleteUser`, 서비스 롤 키 사용)**로 처리한다. `auth.users` 삭제 시 `profiles`는 `on delete cascade`로 함께 정리되고, 연쇄적으로 `rooms`(owner였던 경우), `room_members`, `random_queue` 등도 cascade로 정리된다. 탈퇴 처리 전 "로그인 상태 + 본인 확인"은 서버 액션에서 재검증한다.

---

## 9. Storage 정책 개요

| 버킷 | 정책 |
|---|---|
| `chat-images` | 비공개 버킷. 업로드는 서버 액션에서 서명 URL 발급 후 수행. 조회는 `room_members`/`random_sessions` 참여자만 — Storage RLS 정책에서 경로의 `room_id`/`session_id` 세그먼트를 참여자 여부와 대조 |
| `avatars` (기존) | 변경 없음 |

---

## 10. 타입 재생성

신규 테이블 반영 후 `npm run db:types`로 `lib/supabase/database.types.ts`를 재생성한다 (CLAUDE.md 규칙).

---

*— End of DB_SCHEMA —*
