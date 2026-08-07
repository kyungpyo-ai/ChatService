# 수다온(sudaon) 개발 로드맵

> 이 문서는 `PRD.md`의 요구사항을 실제 개발 순서(마일스톤)로 분해한 것이다. 각 Phase는 순차 진행을 기본으로 하되, 의존성이 없는 작업은 병렬로 진행할 수 있다. 상세 기술 설계는 `ARCHITECTURE.md`, DB 구조는 `DB_SCHEMA.md`, 세부 태스크 단위 계획은 `DEVELOPMENT_PLAN.md`에서 다룬다.

## 상태 표기

- [x] 완료
- [ ] 미착수

---

## Phase 0 — 베이스라인 (완료)

스타터킷 기반으로 이미 갖춰진 부분. 재작업하지 않는다.

- [x] Next.js 15 + Supabase 스타터킷 세팅
- [x] 이메일/OAuth 로그인, 로그아웃 (`app/auth/*`)
- [x] 최초 로그인 시 닉네임 설정 (`app/auth/setup-profile`)
- [x] `profiles` 테이블 + RLS + 회원가입 트리거
- [x] 인증 미들웨어 라우트 보호
- [x] PRD.md 작성

**연관 PRD**: §4.1 AUTH-01, PRO-01, PRO-02

---

## Phase 1 — 문서화 완성

코딩 착수 전 설계 문서를 완성한다.

- [x] PRD.md
- [x] ROADMAP.md (본 문서)
- [x] ARCHITECTURE.md — 시스템 구조, 데이터 흐름, Realtime/Storage 연동 방식
- [x] DB_SCHEMA.md — 테이블/컬럼/제약조건/RLS 정책 상세
- [x] DEVELOPMENT_PLAN.md — Phase별 세부 태스크, 파일 단위 작업 목록 (Phase 2~5 상세, 이후 Phase는 착수 시 갱신)

---

## Phase 2 — UI 뼈대 및 디자인 시스템

백엔드 기능을 붙이기 전에 전체 화면의 정적 마크업과 디자인 톤을 먼저 확정한다. 여기서는 실제 데이터 없이 더미 데이터로 레이아웃만 구성하고, 이후 Phase에서는 이미 만들어진 화면에 데이터·로직만 연결한다.

- [x] 디자인 톤 확정 (화이트톤 베이스 + 단일 강조색, 타이포그래피)
- [x] 홈 화면 — 랜덤채팅 시작 / 채팅방 둘러보기 버튼
- [x] 로그인 화면 (기존 컴포넌트 스타일 재정비) — 기존 스타터킷 폼 유지, 재정비는 Phase 8에서 마무리
- [x] 프로필 화면 — 닉네임/사진/계정 탈퇴 UI
- [x] 매칭 대기 화면 — 진행 상태, 취소
- [x] 랜덤채팅 화면 — 메시지 리스트, 입력창, 종료·재매칭 버튼
- [x] 방 목록 화면 — 검색/분류, 방 카드, 방 만들기 버튼
- [x] 방 생성 화면 — 제목, 인원, 공개/비밀번호 입력 폼
- [x] 방채팅 화면 — 메시지 리스트, 참여자 패널, 입력창, 강퇴 UI
- [x] 사용자 검색 화면 — 검색창, 결과 목록(닉네임, 온라인 여부), 프로필 조회
- [x] 모바일(단일 열) / PC(좌측메뉴+중앙+우측패널) 레이아웃 뼈대
- [x] 하단 고정 입력창/전송 버튼 패턴
- [x] 강퇴·종료·탈퇴 등 주의 액션 버튼 스타일 구분 — 계정 탈퇴 버튼에 destructive 스타일 적용, 강퇴 UI는 Phase 7에서 로직과 함께 추가

**연관 PRD**: §3.5 주요 화면, §6.1 UI/UX 원칙, §6.2 반응형 레이아웃

**완료 조건**: 모든 주요 화면이 더미 데이터로 모바일/PC에서 레이아웃이 깨지지 않고 표시된다. (세밀한 반응형 엣지 케이스는 Phase 7에서 마무리) — Playwright로 8개 화면 × 모바일/PC 뷰포트 검증 완료, 다크모드 전환 확인 완료.

---

## Phase 3 — 방채팅 (텍스트)

MVP의 핵심 축인 로그인 기반 방채팅을 구현한다. Phase 2에서 만든 방 목록/방 생성/방채팅 화면에 실제 데이터와 로직을 연결한다.

- [x] DB: `rooms`, `room_members`, `messages` 테이블 + RLS
- [x] 방 목록 조회 (비로그인 포함 전체 공개)
- [x] 방 생성 (제목, 최대 인원, 공개/비밀번호 — 해시 저장)
- [x] 방 입장 (로그인 필요, 정원 초과 차단, 비밀번호 검증)
- [x] 방채팅 화면에 텍스트 메시지 송수신 연결, Supabase Realtime 구독
- [x] 참여자 목록 데이터 연결
- [x] 내가 참여 중인 방 목록 조회 및 재입장

**연관 PRD**: §5 ROOM-01~05, §5.1 (이미지 제외), §5.2 방채팅 완료 조건(강퇴 제외 부분)

**완료 조건**: 회원이 공개방·비밀번호방을 생성/입장하고 정원 제한이 적용된 상태로 실시간 텍스트 대화가 가능하다.

**검증 완료 (2026-08-02)**: Playwright로 브라우저 탭 2개를 열어 같은 방에서 실시간 텍스트 메시지 송수신 확인. 이 과정에서 발견된 버그 2건 수정:
1. `room_members` SELECT RLS 정책이 자기 자신을 서브쿼리로 참조해 `infinite recursion` 에러 발생 → 방 목록/방채팅 페이지 전체가 500 에러로 깨짐. `is_room_member()` SECURITY DEFINER 함수로 우회하도록 수정.
2. `messages` 테이블이 `supabase_realtime` publication에 등록되어 있지 않아 `postgres_changes` 구독 자체가 불가능했음. `alter publication supabase_realtime add table public.messages` 추가.
3. (코드 수정) 브라우저 Realtime 클라이언트가 기본적으로 `anon` 권한으로 연결되어 로그인 사용자도 `auth.uid()`가 null로 평가되며 메시지 이벤트를 못 받던 문제 — `lib/realtime/messages.ts`에서 구독 전 `supabase.realtime.setAuth(session.access_token)` 호출하도록 수정.

수정 내역은 `supabase/migrations/20260802060000_fix_room_members_recursive_policy_and_realtime_publication.sql` 참고.

**추가 검증 (2026-08-02, 게스트 방 목록 노출)**: 실제 사용자 테스트 중 "로그인 안 한 사용자에게는 방 목록이 안 보인다"는 리포트로 재점검, 버그 2건 추가 수정:
4. `profiles` SELECT RLS가 `authenticated`로만 제한되어 있어, 게스트 요청 시 방장 프로필이 항상 `null`로 조회됨 → `getRoomList()`가 `owner === null`인 방을 필터링해 방 목록이 통째로 비어 보임. anon에게 `username/gender/age/avatar_url` 등 공개 가능한 컬럼만 컬럼 단위 grant로 열어줌(이메일/실명/웹사이트는 계속 비공개).
5. `room_members` count 집계도 anon에게는 항상 0으로 보였음(참여자 명단 자체가 authenticated 전용이라). 명단은 비공개로 유지하면서 참여자 수만 공개하기 위해 `room_member_count(rooms)` SECURITY DEFINER computed-column 함수를 추가하고, `lib/queries/rooms.ts`의 `room_members(count)` 임베드를 이 함수 호출로 교체.

수정 내역은 `supabase/migrations/20260802061500_allow_anon_to_view_public_profile_fields_for_room_list.sql`, `expose_room_member_count_via_security_definer_function` 참고.

**추가 개선 (2026-08-03, 메시지 전송 속도)**: "내가 보낸 메시지도 화면에 바로 안 뜬다"는 문제를 진단, 원인 2가지를 확인 후 수정:
1. `sendRoomMessageAction`(`app/actions/messages.ts`)이 `supabase.auth.getUser()`를 호출하고 있었는데, 이는 Auth 서버에 실제 네트워크 왕복을 하는 세션 재검증 API라 지연이 컸다. `messages` INSERT는 어차피 RLS(`room_members` 참여 여부)가 최종 방어선이므로, 로그인 여부 확인과 `sender_id` 추출만 필요한 이 액션에는 로컬 JWT 서명 검증만 하는 `getClaims()`(`lib/supabase/middleware.ts`에서 이미 쓰고 있는 방식)로 충분해 교체했다.
2. `handleSend`(`components/rooms/room-chat-view.tsx`)가 `sendRoomMessageAction`을 fire-and-forget으로 호출만 하고 로컬 state를 갱신하지 않아, 서버 액션 왕복 + DB INSERT + Realtime 전파를 다 거쳐야 화면에 보였다. `useRoomMessages`(`lib/realtime/messages.ts`)에 `sendMessage()`를 추가해 전송 즉시 임시 id로 낙관적 메시지를 붙이고, Realtime INSERT 이벤트가 돌아오면 `sender_id`+`content`로 매칭해 실제 row(진짜 id/시각)로 치환(reconcile)하도록 변경. 전송 실패 시엔 낙관적 메시지를 제거하고 에러 토스트를 띄운다.

Playwright로 방채팅에 진입해 메시지 전송 시 Realtime 왕복을 기다리지 않고 즉시 화면에 표시되는 것과, 새로고침 후에도 메시지가 정상적으로 남아있는 것(실제 DB insert 성공)을 확인했다.

**추가 개선 (2026-08-03, 참여 중인 방 재입장)**: "내가 들어가 있는 채팅방 목록과 재입장 방법이 없다"는 요청으로 추가. `lib/queries/rooms.ts`에 `getMyRoomList(userId)`를 추가해(`room_members!inner` embed-filter로 내가 속한 방만 조회, `getRoomList()`와 동일한 필드 구성 재사용) `/rooms` 페이지에 "전체 방"/"내가 참여중인 방" 탭(`?tab=mine`, 로그인 사용자 전용)을 추가했다. 재입장 자체는 `/rooms/[roomId]`가 이미 멤버십을 확인해 참여자면 비밀번호 재입력 없이 곧장 방채팅 화면을 보여주던 기존 로직을 그대로 활용 — 목록에서 클릭할 진입점만 새로 만들면 됐다.

---

## Phase 4 — 사용자 검색

`profiles`만으로 구현 가능해 방채팅/랜덤채팅과 독립적으로 진행할 수 있는 기능이다. Phase 2의 사용자 검색 화면에 데이터를 연결한다.

- [x] DB: `profiles`에 `last_seen_at` 컬럼 추가 (온라인 여부 판단용) — Phase 3 착수 시 `20260726125413_add_chat_columns_to_profiles.sql`로 이미 적용됨
- [x] 로그인 세션 동안 주기적으로 `last_seen_at` 갱신 (heartbeat)
- [x] 닉네임 부분 검색 쿼리 (게스트/익명 계정 제외)
- [x] 검색 결과에 온라인 여부(예: 최근 N분 이내 `last_seen_at`) 표시
- [x] 검색 결과에서 프로필 조회 연결
- [x] 방채팅 "나가기" 기능 — 방장이 나가면 방 삭제(cascade), 일반 참여자는 멤버십만 해제
- [x] 방채팅 참여자 온라인 상태 표시 (Realtime Presence — 멤버십과 분리된 개념)
- [x] 방채팅 참여자 입장/퇴장 실시간 반영 (참여자 목록·헤더 정원·시스템 알림 메시지, 새로고침 불필요)
- [x] 방장이 나가서 방이 삭제됐을 때 잔류 참여자에게 실시간 안내 + 방 목록으로 자동 이동

**추가 배경 (2026-08-02)**: 방채팅 사용 중 "뒤로가기를 눌러도 여전히 방에 참여 중인 상태인 게 애매하다"는 피드백으로 논의됨. 결론: "멤버십"(영구, `room_members` 행 — 메시지 기록 접근·재입장 권한 기준)과 "지금 온라인인지"(일시적, Presence 기준)는 서로 다른 개념이므로 분리해서 구현. 브라우저를 그냥 닫는 경우(나가기 버튼 미클릭)는 멤버십이 남아있는 게 의도된 동작이며, 이번에 추가한 Presence는 "온라인 N명" 표시 전용이고 멤버십/정원 계산에는 영향을 주지 않는다.

**추가 검증 (2026-08-02, 참여자 실시간 반영 버그 3건)**: "나가기 버튼이 더보기 메뉴에 숨어있다", "참여자 입장/퇴장이 새로고침해야 반영된다", "입장/퇴장 시 채팅창에 알림이 없다" 요청을 구현하는 과정에서 이 프로젝트의 Realtime 인프라 자체의 제약을 여러 건 발견:
1. **채널 하나에 postgres_changes 바인딩을 2개 이상 걸면 서버 등록이 조용히 실패함** — 클라이언트는 `SUBSCRIBED`를 받지만 `realtime.subscription`에 행이 안 생김(Node 스크립트로 격리 재현·확인). 이벤트마다 별도 채널로 분리해 해결.
2. **`room_members` 테이블이 애초에 `supabase_realtime` publication에 등록된 적이 없었음** — RLS/grant/replica identity를 아무리 고쳐도 postgres_changes 구독 자체가 서버에 등록되지 않던 진짜 원인. `alter publication supabase_realtime add table public.room_members` 추가.
3. **DELETE 이벤트의 old row가 REPLICA IDENTITY FULL이어도 클라이언트에는 기본키(`id`)만 전달됨** — "누가 나갔는지" payload만으로 특정 불가. `room_members` 변경은 `event: "*"` 단일 바인딩으로만 받고, 이벤트가 오면 참여자 목록을 재조회해 이전 상태와 비교(diff)하는 방식으로 입장/퇴장을 판단하도록 변경(`lib/realtime/messages.ts`). 단, REPLICA IDENTITY FULL 자체는 서버가 DELETE 이벤트의 filter(`room_id=eq.X`) 매칭을 하기 위해 여전히 필요함(old row에 room_id가 없으면 필터를 평가할 수 없어 이벤트가 아예 라우팅되지 않음).

수정 내역은 `supabase/migrations/20260802070000_create_leave_room_function.sql` 이후 `20260802120000_restore_room_members_replica_identity_full_for_filter_matching.sql`까지 참고.

**추가 개선 (2026-08-03, 방 삭제 알림 + 참여자 아이콘 정리)**: 실사용 중 발견된 개선 요청 2건을 반영:
1. **방장이 나가서 방이 삭제됐을 때 잔류 사용자 알림**: `rooms` 테이블이 `supabase_realtime` publication에 등록된 적이 없어(위 "참여자 실시간 반영 버그 3건"과 같은 종류의 문제) 방 삭제 이벤트를 구독할 수 없었음 — `alter publication supabase_realtime add table public.rooms` 추가. `useRoomMessages`에 `room-${roomId}-deleted` 전용 채널(DELETE, `id=eq.${roomId}` 필터)을 추가해 `roomDeleted` 상태를 반환하고, `RoomChatView`가 이를 받아 배너+토스트 안내 후 입력창 비활성화, 1.8초 뒤 `/rooms`로 이동시킨다. cascade로 함께 삭제되는 나머지 참여자들의 "OOO님이 나갔습니다" 시스템 메시지 스팸은 방 삭제 시엔 생략하도록 처리.
2. **참여자(사람 모양) 아이콘 정리**: `ChatHeader`의 참여자 목록 버튼이 PC에서도 항상 보였는데, 그 버튼이 여는 모바일용 `ParticipantList` Dialog는 `md:hidden`(768px 미만만), PC 상시 패널 `ParticipantSidePanel`은 `lg:block`(1024px 이상만)이라 **태블릿 크기(768~1024px)에서 버튼을 눌러도 아무것도 안 보이는 사각지대**가 있었음. `ParticipantSidePanel`을 `md:block`으로 맞추고 헤더 버튼엔 `md:hidden`을 추가해 PC에서는 숨김 처리, breakpoint를 `md` 기준으로 통일(`docs/DEVELOPMENT_PLAN.md` §2.5 설계와 일치).

수정 내역은 `supabase/migrations/20260802130000_add_rooms_to_realtime_publication.sql` 참고.

**사용자 검색 구현 완료 (2026-08-03)**: `docs/DEVELOPMENT_PLAN.md` §4.4 계획대로 구현. `updateLastSeenAction()` + `useHeartbeat` 훅(mount 즉시 1회 + visible 상태 60초 간격, `app/(main)/layout.tsx`에 공용 마운트)으로 하트비트를 구현하고, `searchUsers()`(닉네임 ilike + `is_anonymous=false` + 본인 제외, `profiles_username_trgm_idx` 활용)와 `searchUsersAction()`(getClaims 로그인 재검증)으로 검색을 연결했다. 검색 결과 클릭 시 추가 쿼리 없이 프로필 다이얼로그(닉네임/성별/나이/온라인 여부)를 표시하고, 최근 검색어는 서버 저장 없이 `localStorage`로 관리한다.

Playwright + Supabase MCP로 실제 검증: 로그인 사용자가 "kyu"로 검색해 "kyu275" 결과 노출, 하트비트로 `last_seen_at`이 페이지 로드 즉시 갱신됨을 SQL로 확인, `last_seen_at`을 30초 전으로 바꾸면 "오프라인"→"현재 온라인"으로 즉시 전환됨을 확인, 비로그인 상태로 `/search` 요청 시 미들웨어가 `/auth/login?redirect=/search`로 리다이렉트함을 확인, "전체 삭제" 클릭 시 최근 검색 영역이 사라짐을 확인.

**연관 PRD**: §4.4 SEARCH-01~03

**완료 조건**: 로그인 사용자가 닉네임 일부로 회원을 찾고 온라인 여부를 확인할 수 있으며, 게스트는 검색에서 제외된다. (검증 완료)

**추가 개선 (2026-08-07, 방채팅도 삭제 전 아카이브 + 두 아카이브 테이블 보존 기한 정책)**: 랜덤채팅
아카이브(`random_session_archives`)만 있고 방채팅은 삭제 시 아무 기록도 안 남는 비대칭을 발견해
맞췄다. `leave_room()`이 방장 퇴장으로 방을 삭제하기 직전에 제목/참여자 목록/전체 메시지를
`room_archives`에 스냅샷으로 남기도록 수정(1:1 고정인 랜덤채팅과 달리 참여자가 여럿이라
`user_a_id`/`user_b_id` 대신 `member_ids uuid[]` 사용). 방장 퇴장은 원래도 즉시 삭제 후 잔류
참여자에게 실시간 안내가 정상 동작해왔으므로(§Phase 4), 랜덤채팅 종료 때처럼 삭제를 지연시킬
필요는 없었다 — DELETE 이벤트의 RLS 재검증은 삭제 전 old row 기준이라 UPDATE 이벤트 유실 문제가
애초에 없다.

겸사겸사 `random_session_archives`가 유일하게 정리 로직이 없어 무한정 쌓이고 있던 것도 발견해,
두 아카이브 테이블(`random_session_archives`, `room_archives`) 모두 매일 새벽 cron으로 정리하도록
통일했다. 보존 기한은 처음 90일로 잡았다가, 실제 신고는 보통 대화 종료 후 며칠~2주 내에 들어오지
몇 달 뒤는 드물다는 점을 감안해 **30일**로 낮췄다 — 대응 목적은 거의 그대로 충족하면서 장기
누적량은 1/3로 줄어든다.

마이그레이션: `random_session_archives_retention_policy`, `archive_rooms_on_owner_leave`,
`shorten_archive_retention_to_30_days`
(`supabase/migrations/20260807000000_*`, `20260807010000_*`, `20260807020000_*`).

---

## Phase 5 — 랜덤채팅 (텍스트)

방채팅에서 검증한 실시간 메시지 파이프라인을 재사용해, 매칭 로직만 추가로 구현한다. Phase 2의 매칭 대기/랜덤채팅 화면에 데이터를 연결한다.

- [x] DB: `random_queue`, `random_sessions` 테이블 + RLS
- [x] 게스트 임시 ID 발급 (세션 기반) — Supabase Anonymous Sign-in(`signInAnonymously`) 사용
- [x] 매칭 대기열 진입/취소
- [x] 서버/DB 트랜잭션 기반 매칭 로직 (중복 매칭 방지)
- [x] 1:1 랜덤채팅 화면에 텍스트 메시지, 종료·재매칭 연결
- [x] 매칭 이탈 시 대기열 정리 ("매칭 취소" 버튼으로 즉시 정리 + 브라우저 탭을 그냥 닫는 경우까지 커버하는 서버 측 하트비트 기반 TTL 자동 정리, 2026-08-04 추가·검증 완료. §완료 조건 하단 참고)

**연관 PRD**: §4.2 RND-01~03, RND-05

**완료 조건**: 서로 다른 두 브라우저가 로그인 없이 매칭되고 실시간 텍스트 대화 후 정상 종료된다. (검증 완료)

**검증 완료 (2026-08-04)**: `DEVELOPMENT_PLAN.md` §5 계획대로 구현 후 Playwright로 검증.

1. 독립된 브라우저 컨텍스트(쿠키 분리, 각자 익명 로그인) 두 개로 `/random` 접속 → 동일한 세션 id로 매칭되어 `/random/[sessionId]`로 이동함을 확인. 서버 측 방어 원리는 `match_or_wait()`의 `FOR UPDATE SKIP LOCKED` 기반 원자적 매칭(RND-03).
2. 양방향 텍스트 메시지 전송이 Realtime으로 상대방 화면에 즉시 반영됨을 확인(방채팅과 동일한 `postgres_changes` INSERT 구독 파이프라인 재사용).
3. 한쪽이 "종료" 클릭 → 상대방 화면에 "상대방이 대화를 종료했습니다" 배너와 함께 "재매칭"/"홈으로" 버튼이 실시간으로 노출됨을 확인. (버튼 구성은 2026-08-08에 "재매칭" 단독으로 정리됨 — 아래 Phase 5.5 후속 개선 참고)
4. "재매칭" 클릭 → 새 대기열에 진입해 제3의 사용자와 새로운(기존과 다른) 세션 id로 재매칭됨을 확인.
5. "매칭 취소" 클릭 → 홈으로 이동하고 `random_queue`에서 본인 행이 실제로 삭제됨을 SQL로 확인.
6. `mcp__supabase__get_advisors`(security)로 신규 테이블 점검 — 새로운 문제 없음. 경고는 전부 기존 `join_room`/`leave_room` 등과 동일한 패턴(SECURITY DEFINER + 익명 접근은 의도된 설계)이라 무해함.

**검증 중 발견한 이슈 (테스트 오염, 코드 버그 아님)**: 첫 검증 시도에서 두 브라우저가 서로 매칭되지 않고 각자 다른 상대와 매칭되는 현상이 있었다. 원인은 이전에 중단된 테스트 시도들에서 브라우저를 그냥 닫아버려 `random_queue`에 유령 사용자가 남아있었던 것 — `match_or_wait()`가 대기열에서 가장 먼저 기다리던 유령 사용자를 정상적으로 집어간 것이므로 매칭 로직 자체는 올바르게 동작한 것이다. 대기열/세션을 정리(`delete from random_queue`, 활성 세션 종료 처리)한 뒤 재검증해 정상 매칭을 확인했다.

**추가 개선 (2026-08-04, 대기열 하트비트 기반 TTL 자동 정리)**: 위 "테스트 오염" 이슈가 실제로는 사용자 관점에서도 재현 가능한 문제라는 판단 하에("최근에 만난 유저와 바로 재매칭되는 걸 완화해달라"는 요청 처리 중 자연스럽게 논의됨), 브라우저를 그냥 닫아 대기열에 좀비 행이 남는 문제를 이번 Phase 안에서 해결했다. `random_queue`에 `last_seen_at`(하트비트) 컬럼을 추가하고, 대기 화면이 이미 5초 간격으로 재호출하던 `match_or_wait()` 폴백 폴링을 하트비트로 재활용 — 함수 시작 시 20초 이상 갱신되지 않은 대기열 행을 자동 삭제하고, 이미 대기 중인 사용자는 재호출마다 `last_seen_at`을 갱신한다(`queued_at`은 FIFO 순서 유지를 위해 별도로 두고 갱신하지 않음). 마이그레이션 `20260804000000_add_random_queue_heartbeat_and_stale_cleanup.sql` 참고, 설계 근거는 `DEVELOPMENT_PLAN.md` §5.1 "대기열 하트비트 기반 TTL 정리" 참고.

Supabase SQL로 함수를 직접 호출(`set local request.jwt.claims`로 특정 사용자 흉내)하는 방식으로 격리 검증: (1) 신선한 대기열 행(하트비트 20초 이내)은 삭제되지 않고 유지됨, (2) 25~37초 지난 행은 정확히 삭제됨, (3) 정상 매칭·큐 등록 자체는 항상 올바르게 커밋됨을 확인. 이후 Playwright로 프로덕션 빌드(`next build && next start`) 기준 두 브라우저 매칭 + 실시간 메시지 송수신도 재확인 완료.

이 과정에서 검증 환경 자체의 함정 하나를 발견: 이 프로젝트의 개발 서버를 여러 개 동시에 띄운 채 `npm run build`를 돌리면 Windows 파일 잠금으로 `.next` 캐시가 깨져 빌드가 반복 실패한다(증상: "Cannot find module for page: /rooms/new"). 빌드 전엔 항상 겹치는 `next dev`/`next start` 프로세스가 없는지 확인해야 한다.

**추가 개선 (2026-08-04~05, 데이터 정리/보안 재검토)**: 실사용 중 발견된 데이터·권한 관련 문제 4건을 추가로 해결했다. 상세 설계는 `DEVELOPMENT_PLAN.md` Phase 5 상단의 안내 문단 참고.
1. **대화 종료 후에도 URL로 다시 들어가면 대화 내용이 계속 보이던 문제** — 종료된 세션의 `messages`/`random_sessions`가 삭제되지 않고 영구 보관되어 있었음. `end_random_session()`이 종료 즉시 대화 내용을 `random_session_archives`(모더레이션 전용, 참여자 포함 아무도 조회 불가)로 옮기고 라이브 데이터는 삭제하도록 변경 — URL 재방문 시 세션 자체가 없으니 자연스럽게 404.
2. **익명(게스트) 계정이 실가입 회원과 함께 `profiles`에 계속 쌓이던 문제** — 게스트 전용 `guest_profiles` 테이블로 물리적 분리, `profiles`는 실가입 회원 전용으로 정리. 랜덤채팅 관련 테이블(`messages.sender_id`, `random_queue.user_id`, `random_sessions.user_a_id/user_b_id/ended_by`) FK를 `profiles(id)` → `auth.users(id)`로 변경. 매일 새벽 3시 7일 이상 비활동 게스트를 자동 삭제하는 `pg_cron` 배치(`cleanup_stale_anonymous_users`) 추가.
3. **방채팅이 실제로는 게스트도 입장 가능했던 보안 구멍** — PRD상 방채팅은 로그인 회원 전용인데, 방 "생성"만 게스트를 막고 "입장"은 막지 않고 있었음. `join_room()`에 게스트(= `profiles`에 없는 사용자) 차단 체크 추가.
4. **유령 상대와 매칭되는 문제** — 매칭 성사 후의 활성 세션(`random_sessions`)에는 만료 로직이 없어, 한쪽이 종료 버튼 없이 사라지면 세션이 영원히 "active"로 남고 재접속 시 그 유령 세션으로 그대로 복귀하던 문제. `match_or_wait()`가 기존 활성 세션을 반환하기 전에 상대의 마지막 활동 시각을 확인해 2분 이상 무응답이면 자동 종료 후 재매칭하도록 임시 수정 — 단, 이 수정 자체도 시간 기반 추측이라 Phase 5.5에서 Presence 기반으로 대체될 예정(아래 참고).

---

## Phase 5.5 — 랜덤채팅 실시간 감지 재설계 (Presence 기반)

Phase 5를 실사용 검증하며 쌓인 시간 기반 임계값(대기열 20초 TTL, 활성 세션 2분 staleness 체크, 5초 폴백 폴링)이 근본적으로 "얼마나 기다려야 죽은 걸로 볼지 추측"하는 방식이라 한계가 있다고 판단해, Supabase Realtime **Presence**(WebSocket 연결 자체를 상태로 쓰는 기능 — Phase 4 방채팅 온라인 표시에 이미 사용 전례 있음)로 유령 대기자/유령 상대 감지를 재구현한다. 매칭 자체의 정합성(`FOR UPDATE SKIP LOCKED`)은 그대로 유지하고, "지금 이 사람이 진짜 연결되어 있는가"만 시간 추측이 아니라 실제 연결 상태로 판단하도록 바꾸는 것이 핵심이다.

- [x] Presence 스파이크 검증 (대기실 채널 join/leave 반영 속도, 강제 탭 종료 시 leave 이벤트 발생 여부) — Playwright로 실측, WebSocket 프레임까지 직접 확인
- [x] 대기열 유령 정리 — 20초 TTL 삭제 로직 제거. 최초엔 presence roster 필터링으로 교체했으나
      실사용 중 Presence 동기화 자체가 불안정한 것을 발견해 최종적으로는 DB 하트비트 신선도(15초)
      기반 필터링으로 정리(아래 "매칭 신뢰성 문제 및 대기실 Presence 제거" 참고)
- [x] 활성 세션 유령 감지 — 2분 staleness 체크 제거, 세션 Presence 채널의 `leave` 이벤트 기반 즉시 감지로 교체
- [x] 대기 화면 폴링을 presence `sync`/`join` 이벤트 트리거로 전환 (5초 고정 폴링 → 30초 느슨한 폴백만 유지)
- [x] 세이프티넷 pg_cron 배치 추가 (24시간 이상 방치된 활성 세션 강제 종료, 대기열 TTL을 10분으로 완화, 종료된 세션 아카이브도 60초 지연 배치로 분리)
- [x] Playwright로 "상대 탭 강제 종료" 시나리오 재현 검증

**연관 PRD**: §4.2 RND-01~03, RND-05 (Phase 5와 동일 — 구현 방식만 재설계)

**완료 조건**: 대기 중/대화 중 상대가 브라우저를 강제 종료했을 때 수 초 내로 감지되어 유령과 매칭되지 않으며, 세이프티넷 배치는 정상 흐름에서 발동하지 않는다. (검증 완료)

**검증 완료 (2026-08-05)**: Playwright로 프로덕션 빌드(`next build && next start`) 기준 두 브라우저 시나리오를 반복 검증.
1. 매칭: 두 브라우저가 로그인 없이 매칭되어 같은 세션으로 이동 (약 3~4초 내)
2. 메시지 실시간 송수신 정상 확인 (약 0.6초 내 반영)
3. 상대 탭을 `context.close()`로 강제 종료 → 남은 쪽이 **571ms** 안에 "상대방이 대화를 종료했습니다"를 감지 (기존 2분 추측 방식 대비 압도적으로 빠름) — `random-session-${id}` Presence 채널의 `leave` 이벤트로 감지, `endRandomSessionAction()` 자동 호출까지 확인
4. 명시적 "종료" 버튼 클릭 → 상대방이 **671ms** 안에 종료 안내 수신, 세션/대기열 모두 정상 정리됨 SQL로 확인

**검증 중 발견한 버그 2건 (설계 결함, 시간 추측 로직과 무관)**:
1. **동시 매칭 데드락**: `match_or_wait()`가 "이미 대기열에 있으면 하트비트만 갱신하고 즉시 반환"하는 구조라, 두 사용자가 정확히 동시에 들어와 서로를 못 보고 둘 다 자기 자신을 대기열에 등록해버리면 그 이후 재시도(폴링이든 presence 이벤트든)로도 영원히 서로를 못 찾았다 — 원래 Phase 5 설계에도 있던 잠재 결함인데, presence 필터링을 추가하면서 이 경쟁 상태가 훨씬 자주 발생하게 되어 이번에 드러났다. `match_or_wait()`가 이미 대기열에 있어도 매 호출마다 파트너 탐색을 다시 시도하도록 수정(`match_or_wait_retry_while_queued` 마이그레이션).
2. **종료 실시간 알림 누락**: `end_random_session()`이 `status='ended'` UPDATE 직후 같은 호출에서 곧바로 아카이브+삭제까지 했더니, 아직 대화 화면에 남아있는 상대방에게 그 UPDATE 이벤트가 전달되지 않았다(WebSocket 프레임 레벨까지 확인 — 서버는 이벤트를 정상적으로 보내지만 Realtime의 RLS 재검증 시점에 행이 이미 삭제되어 있어 드롭되는 것으로 추정). `end_random_session()`은 상태만 바꾸고, 아카이브+삭제는 별도 cron이 "종료된 지 60초 지난" 세션만 뒤늦게 처리하도록 분리(`defer_random_session_archive_for_realtime_delivery` 마이그레이션).
3. (부수 발견) 매칭 성사 직후 대기실 채널(`postgres_changes` 2개 + presence)의 `removeChannel()`을 기다리지 않고 곧바로 세션 화면으로 넘어가면, 같은 Realtime 연결(브라우저 클라이언트가 내부적으로 재사용) 위에서 새 세션 채널의 구독이 조용히 씹히는 경우가 있었다. `removeChannel()` 완료를 기다린 뒤 화면을 전환하도록 수정.

**추가 개선 (2026-08-05, 게스트 TTL 단축 + 재매칭 후순위 로직 복구)**: 실사용 중 발견한 문제 2건 추가 반영.
1. **게스트 계정 TTL 단축**: 7일(하루 1회 정리) → **1일(6시간마다 정리)**로 완화. 같은 브라우저로
   재방문하면 세션이 그대로 재사용되어 하트비트가 계속 갱신되므로 정상적으로 돌아오는 사용자에게는
   영향이 없고, 정말 다시 안 돌아오는 죽은 계정만 훨씬 빨리 정리된다.
2. **"최근 30분 이내 만난 상대 후순위 미루기" 무력화 버그 수정**: 위 §5.5 검증 중 발견한 "종료 실시간
   알림 누락" 수정(세션 60초 지연 아카이브)의 부작용으로, 종료된 세션이 1분 뒤 `random_sessions`에서
   빠져나가버려 30분 조회 대상 자체가 텅 비어 이 기능이 사실상 항상 무력화되어 있었다. `match_or_wait()`
   의 최근 매칭 조회를 `random_sessions`(현재 활성/방금 종료) + `random_session_archives`(그 이후 아카이브
   된 이력) 양쪽을 함께 보도록 수정. SQL로 30분 이내 아카이브 기록이 정상적으로 감지되는 것 확인.

마이그레이션: `shorten_guest_ttl_and_fix_recent_match_dedup`.

**추가 개선 (2026-08-05, 매칭 신뢰성 문제 및 대기실 Presence 제거)**: 실사용자 두 명으로 라이브
테스트하며 발견한 문제 2건을 반영하며 대기실 쪽 설계를 단순화했다.
1. **Presence만으로는 매칭이 실패하는 경우 발견**: 두 사용자가 30초 넘게 같은 대기실 Presence
   채널에 있었는데도 서로의 uid가 상대 쪽 presenceState()에 안 잡히는 현상을 SQL로 직접 재현
   확인했다 — Playwright(같은 기기, 지연 거의 0) 테스트에서는 안 보였지만 실제 서로 다른 기기/
   네트워크 환경에서는 Realtime Presence 동기화 자체가 완전히 신뢰할 수 없다는 뜻이었다.
2. **"매칭된 걸 알아채는 게 한쪽만 늦는" 문제**: 매칭을 스스로 성사시킨 쪽은 자기 RPC 응답으로
   즉시 알지만, 이미 대기 중이다가 선택된 쪽은 오직 실시간 알림(postgres_changes INSERT)에만
   의존한다. 이 알림도 항상 즉시 오리라는 보장이 없어, 놓치면 폴백 폴링 주기(당시 30초)만큼
   그대로 대기하는 게 원인이었다.

이 두 가지가 결국 "Presence 하나만 믿고 판단하는 구조 자체가 불안정하다"는 같은 결론으로 모여,
대기실 쪽 설계를 정리했다: **대기실 Presence 채널을 완전히 제거**하고, 매칭 후보 판단을 DB
하트비트 신선도(대기 화면이 5초마다 재호출하므로 15초 이내면 살아있는 것으로 간주) 하나로
단순화했다. 폴백 폴링 간격도 30초 → 5초로 되돌려 "선택된 쪽"이 알아채는 최악의 지연을 줄였다.
세션 쪽 Presence(상대 이탈 즉시 감지)는 실제로 잘 동작했고 대체할 하트비트 기반 방법이 없어
그대로 유지한다. Playwright로 재검증: 매칭 2.8초, 메시지 실시간 0.5초, 강제 종료 감지 3.1초 —
전부 정상.

마이그레이션: `match_or_wait_heartbeat_fallback_for_presence`,
`remove_waiting_room_presence_use_heartbeat_only`.

**추가 개선 (2026-08-06, 세션 쪽 Presence 단독 신뢰의 한계 발견 + 세션 전용 하트비트)**: 바로 위
"세션 쪽 Presence는 실제로 잘 동작했다"는 판단이 실사용자 재테스트에서 뒤집혔다 — 정상적으로
브라우저를 종료했는데도 `leave` 이벤트가 안 와서 상대 화면에 세션이 계속 살아있는 경우가 재현됐다.
`get_logs`로 확인한 원인은 브라우저 종료 방식이 아니라 **Realtime 서버(테넌트)가 접속자가 뜸하면
통째로 잠들었다 재연결 시 깨는 주기** — 이 재초기화 구간에 걸리면 leave 이벤트 자체가 서버에서
유실된다. 캐시된 presence 상태를 다시 읽는 방식으로는 이 유실을 못 잡으므로, 검색 화면 온라인
표시용 하트비트(탭 백그라운드 시 정지)를 잠깐 재사용했다가 "채팅 중 다른 탭 봤다고 오판 종료"되는
새 버그를 만들어 바로 되돌리고, **세션 전용(탭 가시성 무관, 10초 간격) 하트비트**를 새로 도입했다
— 상대 하트비트가 25초 넘게 없으면 직접 종료 처리한다. Presence leave는 그대로 "되면 빠른" 경로로
남고, 이 하트비트가 최악의 경우에도 약 35초 안에는 잡아주는 하한선이 된다. DB 재접속 시 활성 세션
반환/cron 안전망은 같은 컬럼을 90초의 느슨한 최후 보험으로만 쓴다. 상세: `DEVELOPMENT_PLAN.md`
§5.5.6 후속 수정 참고.

마이그레이션: `heartbeat_backstop_for_stale_active_sessions`(되돌림),
`session_scoped_heartbeat_for_active_leave_detection`, `heartbeat_random_session_return_ended_by`.

**추가 개선 (2026-08-07~08, 실사용 중 발견한 채팅 UI 버그 3건 + 종료 UX 정리)**: 랜덤채팅/방채팅
공통으로 실사용 중 드러난 문제들을 정리했다.

1. **방채팅에서 나갔다 다시 들어오면 이전 대화가 통째로 안 보이던 버그(실제 데이터 손실 아님)** —
   `getRoomMessages()`가 `profiles!messages_sender_id_fkey(...)` PostgREST embed로 발신자 프로필을
   조인하고 있었는데, Phase 5의 게스트 분리 작업에서 `messages.sender_id` FK를 `profiles` →
   `auth.users`로 바꾼 탓에 이 embed 힌트가 더 이상 유효하지 않게 되어 쿼리가 조용히 실패하고 있었다
   (`if (error || !data) return []` 때문에 "메시지 없음"으로 보였음). 방채팅은 게스트가 못 들어오므로
   발신자는 항상 `profiles`에 있다는 전제로, 메시지와 프로필을 각각 조회해 `sender_id` 기준으로
   직접 합치도록 변경(`lib/queries/rooms.ts`).
2. **두 채팅 모두 스크롤이 마지막 메시지로 자동 이동하지 않던 문제** — 원인은 CSS 플렉스 레이아웃
   결함이었다. 바깥 래퍼가 `min-h-screen`(하한만 있고 상한 없음)이라 `flex-1 overflow-y-auto`인
   메시지 목록이 높이를 제한받지 못해 내부 스크롤이 아예 발생하지 않았고, 문서 전체가 스크롤되면서
   마지막 메시지가 `sticky` 입력창 뒤에 가려졌다. 바깥 래퍼를 `h-screen overflow-hidden`으로,
   목록에는 `min-h-0`을 추가해 해결. 추가로 sentinel + `scrollIntoView({block:'end'})` 방식은
   컨테이너 자체의 하단 padding까지는 밀어주지 못해 스크롤바가 끝에 닿지 않은 것처럼 보였기 때문에,
   컨테이너의 `scrollTop`을 `scrollHeight`로 직접 맞추는 방식으로 교체했다. Playwright로 실제 DOM을
   측정해 검증(`scrollTop 505.14` vs `maxScroll 505` — 서브픽셀 오차만 남음).
3. **랜덤채팅 종료 UX 정리** — (a) "종료" 클릭 시 재확인 다이얼로그 없이 즉시 종료되도록 변경하고
   `components/random/end-session-dialog.tsx` 삭제, (b) 종료 사실이 잘 안 보인다는 피드백에 따라
   상단 배너를 강조 스타일로 바꾸고 대화 목록 맨 아래에도 시스템 알림 버블("상대방이 대화를
   종료했습니다" / "대화를 종료했습니다")을 추가, (c) 종료 후 하단 버튼을 "재매칭" 단독으로 정리
   ("홈으로" 제거 — 헤더의 뒤로가기와 중복).
4. (부수) 로그아웃 버튼을 프로필 화면 안에서 좌측 사이드바로 옮겨 상시 노출(`components/layout/sidebar-nav.tsx`).

---

## Phase 6 — 이미지 전송

방채팅·랜덤채팅 양쪽에 공통으로 적용되는 이미지 전송 기능을 이 시점에 한 번에 구현한다.

- [ ] Supabase Storage 버킷 설정 (채팅 이미지)
- [ ] 이미지 업로드 (JPG/PNG/WEBP, 최대 5MB, UUID 파일명)
- [ ] 이미지 형식·용량 서버 검증
- [ ] 방채팅에 이미지 메시지 연동
- [ ] 랜덤채팅에 이미지 메시지 연동

**연관 PRD**: §4.2 RND-04, §5 ROOM-05, §5.1 이미지 정책, §7.1 이미지 검증

---

## Phase 7 — 권한 검증 및 계정 관리

강퇴, 계정 탈퇴 등 서버 측 권한 재검증이 핵심인 기능들을 모아 구현한다.

- [ ] 방장 강퇴 기능 + 서버 측 방장 권한 재검증
- [ ] 강퇴된 사용자 재입장 차단
- [ ] 계정 탈퇴 (확인 절차 + 서버 재검증 + 재로그인 차단)
- [ ] 메시지 전송/방 생성 요청 횟수 제한(rate limit)
- [ ] 비참여 사용자의 메시지 접근 차단 검증 (RLS 점검)

**연관 PRD**: §4.1 AUTH-02, §5 ROOM-06, ROOM-07, §7.1 전체

**완료 조건**: 일반 회원의 강퇴 요청 거부, 계정 탈퇴 후 재로그인 불가, 비참여자 메시지 접근 차단이 모두 검증된다.

---

## Phase 8 — UI/UX 마감 및 반응형

Phase 2에서 잡은 뼈대에 실제 데이터가 다 연결된 상태에서, 세밀한 반응형 엣지 케이스와 마감 디테일을 다듬는다.

- [ ] 홈 화면 최종 브랜딩 점검
- [ ] 모바일/PC 레이아웃 세부 반응형 점검 (겹침/잘림 확인)
- [ ] 메시지 리스트 스크롤/롱텍스트/이미지 렌더링 엣지 케이스
- [ ] 강퇴·종료·탈퇴 등 주의 액션 UI 최종 검수
- [ ] 접근성/로딩·에러 상태 점검

**연관 PRD**: §6.1, §6.2, §7.2 반응형

---

## Phase 9 — 배포

- [ ] Vercel 프로젝트 연결 및 환경 변수 설정
- [ ] Auth·DB·Realtime·Storage 연결 정상 확인
- [ ] 최종 출시 수용 기준(§7.2) 전체 재검증
- [ ] 배포 후 오래된 탭의 구버전 클라이언트 감지 및 새로고침 유도 (버전 스큐 처리)

**연관 PRD**: §7.2 배포, §7.3 개발 순서

**버전 스큐 처리 관련 메모 (2026-08-05)**: 배포 중 서버 코드를 바꾸는 동안 이미 열려있던 탭이
예전 JS를 계속 실행해 매칭이 안 되는 현상을 실제로 겪었다(개발 중 반복 재배포로 인한 일시적
현상이었지만, 실서비스 배포 후에도 똑같이 재현될 수 있는 유형의 문제). 구현 시 유의할 점:
- **절대 대화 중에 강제로 새로고침하면 안 된다** — `/random/[sessionId]`, `/rooms/[roomId]` 같은
  활성 채팅 화면에서는 새 버전 감지를 하더라도 자동 새로고침을 하지 않는다.
- 대신 비침습적인 배너/토스트("새 버전이 있습니다, 새로고침 해주세요")로 알리고 사용자가 원할 때
  직접 새로고침하게 하거나, 채팅 화면이 아닌 곳(홈, 목록 화면)에서 자연스러운 다음 네비게이션
  시점에만 반영한다.
- 감지 방법은 빌드 버전을 노출하는 가벼운 엔드포인트를 주기적으로 확인하거나, Next.js 청크 로드
  실패를 감지해 트리거하는 방식 등을 착수 시점에 검토한다.

---

## Phase 10 — 후속 검토 (MVP 이후, 범위 외)

- [ ] 광고 배치 및 수익화
- [ ] 운영자 관리 화면
- [ ] 관심사 기반 매칭
- [ ] 친구·쪽지·알림
- [ ] 콘텐츠 자동 검수

**연관 PRD**: §7.4

---

## 마일스톤 요약

| Phase | 산출물 | 상태 |
|---|---|---|
| 0 | 인증/프로필 베이스라인 | 완료 |
| 1 | 설계 문서 4종 | 완료 |
| 2 | UI 뼈대 및 디자인 시스템 | 완료 |
| 3 | 방채팅(텍스트) | 완료 |
| 4 | 사용자 검색 | 완료 |
| 5 | 랜덤채팅(텍스트) | 완료 |
| 5.5 | 랜덤채팅 실시간 감지 재설계(Presence) | 완료 |
| 6 | 이미지 전송 | 미착수 |
| 7 | 권한 검증/계정 관리 | 미착수 |
| 8 | UI/UX 마감·반응형 | 미착수 |
| 9 | 배포 | 미착수 |
| 10 | 후속 검토 (범위 외) | 미착수 |
