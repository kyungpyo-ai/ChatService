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

**버그 수정 (2026-08-08, 초기 메시지가 "최근 50개"가 아니라 "가장 오래된 50개"였음)**: 실사용 중 "채팅방에 다시 들어가면 맨 처음 대화가 보인다"는 리포트로 발견. `getRoomMessages()`(`lib/queries/rooms.ts`)와 `getRandomSessionMessages()`(`lib/queries/random.ts`) 모두 `order(created_at, ascending: true).limit(50)`이라, 메시지가 50개를 넘는 순간 **가장 오래된 50개만 조회되고 최근 대화가 통째로 안 보였다.** 최신순(`ascending: false`)으로 자른 뒤 표시용으로 시간순으로 되돌리도록 수정. 메시지 60개짜리 방으로 SQL 검증 — 수정 전 `메시지 01~50`, 수정 후 `메시지 11~60`. Phase 3/5부터 있던 버그이며 이미지 전송과는 무관하다(메시지 개수가 50개를 넘는 방이 그동안 없어 드러나지 않았음).

**정책 변경 (2026-08-08, 방채팅 이전 대화 노출 범위 = 입장 시점 이후)**: 위 버그를 고치며 "새로
입장한 사람이 이전 대화를 어디까지 봐야 하는가"를 함께 검토했다. 기존 `messages` SELECT 정책은
"이 방의 멤버인가"만 확인하고 입장 시점을 비교하지 않아, **새로 입장한 사람이 그 방의 과거 대화를
전부 볼 수 있었다.** 이 서비스의 공개방은 목록에 노출되고 로그인만 하면 누구나 자유롭게 입장할 수
있으므로, 아무나 들어와 과거 대화를 읽고 나가는 것이 가능한 상태였다.

카카오톡 오픈채팅과 동일하게 **입장 시점(`room_members.joined_at`) 이후 메시지만** 보이도록 변경했다
(Slack·Discord식 전체 공개는 기각 — 이 서비스는 익명성이 강한 오픈채팅에 가깝다). `room_members`를
정책에서 직접 서브쿼리하면 Phase 3의 무한 재귀가 재발하므로 `room_member_joined_at()` SECURITY
DEFINER 함수로 감쌌다. 비멤버는 이 함수가 null을 반환하고 `created_at >= null`이 거짓으로 평가되어,
멤버십 확인과 시점 컷오프가 조건 하나로 동시에 처리된다.

SQL로 3개 시점 검증: 입장 전 5개 + 입장 후 3개인 방에서 **늦게 입장한 참여자는 3개만**, 방장은 8개
전부, 비참여자는 0개.

부수 효과로 알아둘 점:
- **나갔다가 재입장하면 본인이 쓴 과거 대화도 안 보인다** — "나가기"가 `room_members` 행을 삭제하고
  재입장 시 `joined_at`이 갱신되기 때문. 오픈채팅도 동일하게 동작하므로 의도된 것으로 둔다.
  (브라우저만 닫은 경우는 멤버십이 유지되어 영향 없음 — §Phase 4의 멤버십/Presence 분리)
- **이미지는 Storage RLS를 별도로 자르지 않았다** — 과거 메시지가 안 보이면 이미지 경로(UUID)를
  알 수 없어 실질적 노출 경로가 없고, 경로별 시점 비교를 추가하는 복잡도가 이득보다 크다고 판단.
- **아카이브/모더레이션은 영향 없다** — `leave_room()`의 아카이브 로직은 SECURITY DEFINER라 RLS를
  우회하므로 방 삭제 시 전체 대화가 그대로 보존된다.

마이그레이션: `supabase/migrations/20260808030000_limit_room_message_history_to_join_time.sql`

---

## Phase 6 — 이미지 전송

방채팅·랜덤채팅 양쪽에 공통으로 적용되는 이미지 전송 기능을 이 시점에 한 번에 구현한다.

- [x] Supabase Storage `chat-images` 비공개 버킷 + 참여자 전용 Storage RLS 정책
- [x] 이미지 업로드 (JPG/PNG/WEBP, 최대 5MB, UUID 파일명) — 서버 액션이 서명 업로드 URL 발급, 파일은 클라이언트가 Storage로 직접 전송
- [x] 이미지 형식·용량 서버 검증 (버킷 레벨 강제 + 메시지 INSERT 시 오브젝트 메타데이터 재확인)
- [x] 저장된 Storage 경로 → 서명 URL 변환 (초기 로드는 배치 발급, 실시간 수신은 단건)
- [x] 방채팅에 이미지 메시지 연동
- [x] 랜덤채팅에 이미지 메시지 연동 (게스트 업로드 포함)
- [x] 삭제된 방/만료된 아카이브의 이미지 정리 배치 (DB cascade는 Storage 파일을 지우지 않음 — 보존 기한은 아카이브와 동일하게 30일)

**연관 PRD**: §4.2 RND-04, §5 ROOM-05, §5.1 이미지 정책, §7.1 이미지 검증

**착수 전 확인 사항 (2026-08-08 조사)**: 이미지 메시지의 **표시 경로는 이미 전부 구현되어 있다** — `messages.content_type='image'` 스키마, `lib/queries/*`·`lib/realtime/*`의 `imageUrl` 매핑, `ChatMessageBubble`의 이미지 렌더링, `next.config.ts`의 Supabase 호스트 허용까지. 실제로 없는 것은 버킷/정책, 업로드 경로, 경로→URL 변환, 정리 배치 4가지다. 단 기존 매핑이 `imageUrl: message.content`로 **Storage 경로를 URL 자리에 그대로 넣고 있어** 서명 URL 변환을 넣을 때 반드시 함께 고쳐야 한다. 상세 계획은 `DEVELOPMENT_PLAN.md` §Phase 6 참고.

**설계 문서 정정 필요**: `ARCHITECTURE.md` §8의 경로 규칙 `{room_id 또는 session_id}/{uuid}`는 Storage RLS에서 `rooms`와 `random_sessions` 중 어느 쪽을 조회할지 판별할 수 없어 `rooms/{room_id}/` · `sessions/{session_id}/` 접두사 방식으로 정정한다. 같은 §8의 "서버 액션에서 업로드"도 Next.js 서버 액션 body 상한(기본 1MB) 탓에 5MB 파일에 적용 불가라, `DB_SCHEMA.md` §9에 이미 적혀 있는 서명 업로드 URL 방식으로 통일한다.

**검증 완료 (2026-08-08)**: 프로덕션 빌드(`next build && next start`) 기준 Playwright + SQL로 검증.

1. **방채팅 이미지 전송** — PNG(1.3MB)/JPG/WEBP 3종 전송 후 `messages` row와 `storage.objects`의 `mimetype`/`size`가 정확히 일치함을 SQL로 확인. 경로 규칙(`rooms/{roomId}/{uuid}.{ext}`)도 확인.
2. **낙관적 UI reconcile** — 전송 직후 붙은 로컬 blob URL이 Realtime INSERT 도착 후 실제 서명 URL(`/storage/v1/object/sign/chat-images/...`)로 치환되는 것을 DOM에서 확인. 메시지 중복 행 없음.
3. **초기 로드 배치 서명 URL** — 두 번째 사용자가 방 입장 후 새로고침 상태에서 이미지가 정상 로드됨(`naturalWidth 224`, `complete true`).
4. **게스트(익명) 랜덤채팅 업로드** — 비로그인 상태로 매칭된 익명 사용자가 `sessions/{sessionId}/` 경로로 업로드 성공, `auth.users.is_anonymous = true`로 확인.
5. **3중 검증 전부 동작** — 클라이언트 검증(5MB 초과 시 "이미지는 5MB 이하만 첨부할 수 있습니다" 토스트, 미리보기 미생성) + 클라이언트를 우회한 Storage REST 직접 호출도 **버킷 레벨에서 차단**: 6MB → `413 EntityTooLarge`, `application/pdf` → `415 InvalidMimeType`.
6. **비참여자 차단** — 참여하지 않은 방 경로로 업로드 시도 → `403 new row violates row-level security policy`. 남의 이미지 경로로 서명 URL 발급/직접 다운로드 시도 → `404 Object not found`(존재 여부조차 노출되지 않음).
7. **정리 배치 생애주기** (가장 중요 — 정상 이미지를 지우는 사고 방지):
   - 살아있는 메시지가 참조하는 이미지는 **생성 시각을 2시간 전으로 백데이트해 1시간 유예를 무력화해도** 고아로 잡히지 않음 (0건)
   - 어떤 메시지도 참조하지 않는 오브젝트만 정확히 검출됨 (1건)
   - 랜덤 세션 종료 → `archive_ended_random_sessions()`로 라이브 메시지가 삭제되고 아카이브로 이동한 뒤에도, **아카이브가 참조하므로 고아로 잡히지 않음**
   - 아카이브 행까지 삭제(=30일 만료 시뮬레이션)하자 비로소 고아로 검출됨

**검증 중 발견·수정한 버그 1건**: `/api/cron/cleanup-chat-images` 요청이 **미들웨어에 가로채여 `/auth/login`으로 307 리다이렉트**되고 있었다. 세션 쿠키가 없는 Vercel Cron 요청은 엔드포인트의 `CRON_SECRET` 검증에 **도달조차 못 해** 정리 배치가 조용히 실행되지 않았을 문제다(배포 후에야 드러났을 유형). `lib/supabase/middleware.ts`의 공개 경로 목록에 `/api/cron`을 추가해 해결 — 이 경로는 세션이 아니라 `CRON_SECRET`으로 스스로를 보호한다. 수정 후 인증 게이트 재검증: 헤더 없음/잘못된 시크릿 → `401`, 올바른 시크릿 → 다음 단계 진행.

**정리 배치 실제 삭제 검증 완료 (2026-08-08)**: `SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET` 설정 후 엔드포인트를 수동 호출해 마무리했다. 마침 실사용자가 직접 테스트하며 올린 이미지가 섞여 있어 **실전 데이터로 검증**하는 셈이 됐다 — 총 12장 중 고아 5장만 정확히 삭제되고, 살아있는 방의 이미지 4장과 **10시간 전 종료된 랜덤 세션의 이미지 3장**은 그대로 보존됐다. 특히 후자는 세션 행과 라이브 메시지가 이미 삭제됐는데도 `random_session_archives`가 참조하고 있어 보호된 것으로, 30일 보존 정책이 실제 데이터에서 의도대로 동작함을 확인했다. 실행 후 고아 0건.

참고로 Postgres에서 `storage.objects`를 직접 DELETE하면 `Direct deletion from storage tables is not allowed`로 막히는 것도 실제로 확인했다 — "pg_cron만으로는 실제 파일을 못 지운다"는 §6.1 (5)의 판단이 사실로 확인된 셈이다.

---

## Phase 7 — 권한 검증 및 계정 관리

강퇴, 계정 탈퇴 등 서버 측 권한 재검증이 핵심인 기능들을 모아 구현한다.

- [x] 방장 강퇴 기능 + 서버 측 방장 권한 재검증
- [x] 강퇴된 사용자 재입장 차단
- [x] 계정 탈퇴 (확인 절차 + 서버 재검증 + 재로그인 차단)
- [x] **탈퇴 시 아카이브 우회 문제 해결** — 아래 참고
- [x] 메시지 전송/방 생성/**이미지 업로드** 요청 횟수 제한(rate limit) — 이미지 업로드는 게스트도 가능해 스팸·불법 이미지의 주요 경로이므로 Phase 6에서 이월된 항목
- [x] 비참여 사용자의 메시지 접근 차단 검증 (RLS 점검)

**연관 PRD**: §4.1 AUTH-02, §5 ROOM-06, ROOM-07, §7.1 전체

**완료 조건**: 일반 회원의 강퇴 요청 거부, 계정 탈퇴 후 재로그인 불가, 비참여자 메시지 접근 차단이 모두 검증된다.

**실행 계획 수립 완료 (2026-08-08)**: 상세 설계는 `DEVELOPMENT_PLAN.md` §Phase 7 참고. 핵심 결정은 아래 아카이브 우회 문제를 **`rooms`/`random_sessions` BEFORE DELETE 트리거**로 해결하는 것 — `leave_room()`/`end_random_session()`이 각자 수동으로 하던 아카이브 INSERT를 트리거로 옮겨, 계정 탈퇴의 cascade든 Phase 7.5의 관리자 강제 삭제든 삭제 경로와 무관하게 아카이브가 항상 남도록 만든다. 강퇴는 이미 있는 `kick_member()`/`room_bans` 재입장 차단에 UI만 연결하면 되고, rate limit은 외부 서비스 없이 DB 카운터 테이블(`rate_limit_events`)로 구현한다.

**⚠️ 착수 전 반드시 처리할 것 (2026-08-08, Phase 6 검증 중 발견)**: `rooms.owner_id`가
`profiles(id)`를 **`ON DELETE CASCADE`** 로 참조하고 있어, 계정 탈퇴를 그대로 구현하면 다음이
일어난다.

```
계정 탈퇴 → profiles 삭제 → 그 사용자가 만든 rooms 전부 cascade 삭제
  → messages 전부 cascade 삭제 → leave_room()의 아카이브 로직을 거치지 않음
  → 대화 기록이 room_archives에 남지 않고 통째로 증발
  → 이미지도 참조가 사라져 다음 정리 배치에서 삭제됨
```

즉 **신고 대응용 30일 보존이 탈퇴 한 번으로 무력화**되고, 신고당한 사용자가 탈퇴로 증거를 없앨 수
있다. Phase 6에서 정리 배치를 검증하다 테스트 방을 `delete from rooms`로 직접 지웠을 때 아카이브가
생기지 않는 것을 보고 발견했다(정리 배치 자체의 결함은 아님 — 아카이브가 있는 이미지는 정상적으로
보호되는 것을 실사용 데이터로 확인했다).

대응 방향(착수 시 결정): 탈퇴 서버 액션에서 `auth.admin.deleteUser` 호출 **전에** 해당 사용자가
방장인 방들을 아카이브 처리하거나, 아카이브를 남기는 트리거를 `rooms` DELETE에 붙여 경로와 무관하게
보장하는 방법. 후자가 누락 위험이 적다. **Phase 7.5의 관리자 강제 삭제도 같은 함정이 있으므로**
트리거 방식이면 양쪽을 한 번에 해결한다.

**구현 완료 (2026-08-09)**: 계획대로 `rooms`/`random_sessions` BEFORE DELETE 트리거로
아카이브를 통합했다. 마이그레이션 `20260808040000_archive_via_trigger_and_rate_limits.sql`
참고. `leave_room()`/`archive_ended_random_sessions()`에서 수동 아카이브 INSERT를 제거하고
DELETE만 남겼으며, 트리거(`archive_room_before_delete`, `archive_random_session_before_delete`)가
삭제 직전 행을 무조건 스냅샷한다. rate limit은 `rate_limit_events` 테이블 + DB 카운터 함수
`check_and_record_rate_limit(action, max_count, window_seconds)`로 구현(메시지 전송 10초당
10회, 방 생성 1일 5회, 이미지 업로드 1분당 10회 — 임의 기본값, 필요 시 조정).

**검증 중 발견한 버그 2건 (계획에 없던 것)**:

1. **`kick_member()` 함수가 실제로는 존재하지 않았다.** `DB_SCHEMA.md`가 Phase 3 설계
   때부터 표에 문서화해뒀지만 어느 마이그레이션에도 구현된 적이 없었다(`kick_member`로
   `pg_proc` 조회 시 0건 — 문서와 실제 DB가 어긋나 있던 사례). 강퇴 서버 액션을 만들며
   뒤늦게 발견해 `20260809000000_create_kick_member_function.sql`로 새로 구현했다.
2. **트리거를 SQL로 직접 검증하다가 계정 탈퇴 자체가 FK 위반으로 실패하는 걸 발견했다.**
   `messages.sender_id → auth.users(id)`와 `room_bans.banned_by → profiles(id)`가 둘 다
   `ON DELETE NO ACTION`이라, 방장이 아닌 방/세션에서 메시지를 보낸 적이 있거나 누군가를
   강퇴한 적이 있는 계정은 삭제 시도 자체가 `violates foreign key constraint` 에러로
   막혔다 — 아카이브를 건너뛰는 수준이 아니라 탈퇴 기능이 통째로 동작하지 않는 문제였다.
   `ON DELETE CASCADE`는 탈퇴한 사람이 **남의** 방/세션에 남긴 메시지까지 지워 상대방
   대화 기록에 구멍을 내므로 채택하지 않고, 사용자에게 두 가지 방안을 제시해
   **`ON DELETE SET NULL`(권장안)**을 선택받았다 — 메시지/강퇴 기록은 그대로 남기고
   "누가 보냈는지"만 잃는다. `20260808050000_nullable_sender_and_banned_by_for_account_deletion.sql`로
   반영, `sender_id`가 null이면 방채팅 화면에 "탈퇴한 사용자"로 표시한다
   (`lib/queries/rooms.ts`/`random.ts`). 실제 SQL로 3계정짜리 시나리오(방장 계정 삭제,
   남의 방에 메시지를 남긴 계정 삭제)를 재현해 대화 기록이 살아남고 트리거 아카이브도
   정상 생성되는 것까지 확인했다.

강퇴당한 본인이 실시간으로 알림을 받는 경로도 검증 중 재설계했다: `room_members` DELETE
Realtime 이벤트는 RLS 평가 시점에 이미 자기 자신의 멤버십 행이 사라진 뒤라 본인에게는
전달되지 않을 가능성이 컸다. 대신 강퇴 시 새로 생기는 본인 소유 `room_bans` 행을 구독하도록
바꾸고(`20260809010000_allow_banned_user_to_view_own_ban_and_kick_realtime.sql`), 본인이
자신의 밴 기록을 조회할 수 있는 RLS 정책과 `room_bans`의 realtime publication 등록(기존에
빠져 있었음 — Phase 3의 `messages` publication 누락과 같은 종류의 함정)을 추가했다.

---

## Phase 7.5 — 관리자 페이지 (사이트 운영)

서비스 운영에 필요한 최소한의 관리자 화면을 구축한다. Phase 6(이미지 전송)에서 이미지 데이터가 생기고 Phase 7에서 서버 측 권한 재검증 패턴이 확립된 뒤에 착수하는 것이 자연스럽고, 배포(Phase 9) 시점에는 반드시 갖춰져 있어야 실제 운영이 가능하다. 원래 Phase 10(범위 외)의 "운영자 관리 화면" 항목이었으나, 실사용 운영에 필수라고 판단해 MVP 범위로 끌어올렸다.

### 접근 제어 (선행)

- [x] `profiles.role` 기반 관리자 판별 (기존 스타터킷의 `role` 컬럼 재사용, `admin` 값 정의, `is_admin()` SECURITY DEFINER 함수)
- [x] `/admin/*` 라우트 보호 — 로그인 자체는 기존 미들웨어가 그대로 막고, **관리자 판별은 `app/admin/layout.tsx`(화면 레벨)에서 `is_admin()`으로 재확인해 404 반환**(리다이렉트 대신 404 — 관리자 경로 존재 자체를 비관리자에게 노출하지 않기 위함. `/rooms/new`의 기존 화면 레벨 가드 패턴과 동일)
- [x] 모든 관리자 조회/액션에 서버 측 관리자 권한 재검증 (클라이언트 판별만 믿지 않음)
- [x] 관리자 전용 조회를 위한 RLS 정책 또는 SECURITY DEFINER 함수 설계 (일반 사용자 RLS를 느슨하게 만들지 않는 방향)

### 대화 내용 조회

**설계 원칙(2026-08-09 상세 계획 수립 중 확정)**: 관리자가 "지금 진행 중인 대화"와 "종료된 대화"를 별도 메뉴를 오가지 않고 편리하게 확인하는 것이 이 그룹의 핵심 요구사항이다. 방채팅/랜덤채팅 각각 **하나의 통합 화면에서 "진행 중"/"종료됨" 탭**으로 전환하는 구조로 만들고, 메시지 타임라인 컴포넌트도 양쪽에서 동일하게 재사용한다(진행 중 화면과 아카이브 화면을 완전히 별개로 만들지 않음).

- [x] 방채팅 조회 — 방 목록/검색(진행 중), 방별 메시지 타임라인, 참여자 목록
- [x] 방채팅 아카이브(`room_archives`) 조회 — 삭제된 방의 스냅샷, 위와 같은 화면의 "종료됨" 탭
- [x] 랜덤채팅 조회 — **진행 중인 세션 목록·타임라인**(최초 계획엔 누락돼 있었음), 강제 종료 기능 포함
- [x] 랜덤채팅 아카이브(`random_session_archives`) 조회 — 종료된 세션 검색(참여자 id/기간 기준), 위와 같은 화면의 "종료됨" 탭
- [x] 전송된 이미지 확인 — 메시지에 첨부된 이미지 썸네일/원본 열람 (Storage 관리자 접근 경로 설계, 진행 중/아카이브 공통 경로 하나로 통일)

> **Phase 6에서 확인된 제약 (착수 시 전제)**: 이미지 파일과 그 경로는 대화 아카이브에 30일간 정상 보존되지만, **관리자 계정으로 로그인해도 볼 수 없다.** `chat-images`의 Storage RLS가 "해당 방/세션의 참여자"에게만 조회를 허용하는데, 방이 삭제되거나 세션이 종료되면 참여자 자체가 사라지기 때문이다(참여자에게 접근을 끊는 것은 의도된 동작 — §Phase 6). 따라서 관리자 열람은 반드시 **서비스 롤 키를 쓰는 서버 측 경로**(Route Handler에서 서명 URL을 발급해 전달하는 방식 등)로 만들어야 하며, 일반 사용자용 Storage RLS를 느슨하게 풀어서 해결하려 하면 안 된다.
- [x] 기간·사용자·키워드 기준 메시지 검색 — **날짜 범위를 필수 파라미터로 강제**해 무제한 전체 스캔 경로를 만들지 않는다(2026-08-09 사용자 요청 반영: "DB 전체 조회가 부담되면 날짜를 정해서라도"). 진행 중 메시지는 부분 trgm 인덱스로, 아카이브(`messages jsonb` 통짜 저장)는 날짜로 먼저 행을 좁힌 뒤에만 jsonb를 펼쳐 검색

> 주의: 두 아카이브 테이블은 현재 30일 보존 정책(매일 새벽 cron 정리)이므로, 관리자 화면에서도 "30일 이전 기록은 남아있지 않음"을 명시한다. Storage 이미지의 보존 기한도 이 정책과 맞출지 Phase 6 착수 시점에 함께 결정한다.

### 사용자 관리

- [x] 가입 회원 목록 (`profiles`) — 닉네임/이메일/가입일/최근 접속(`last_seen_at`) 조회, 검색·정렬
- [x] 회원 상세 — 참여 중인 방 수·신고 이력, 정지/탈퇴 액션 (※ 방별 최근 대화 이력 링크는 위 통합 조회 화면으로 안내하는 형태로 단순화 — 아래 "구현 완료" 메모 참고)
- [x] 게스트(`guest_profiles`) 현황 조회 — 활성 게스트 수(대시보드 지표 재사용), 자동 정리 배치 동작 확인용
- [x] 이용 제재 — 계정 정지/차단, 강제 탈퇴 (사유·기간 기록)

> **✅ Phase 7 선행 처리 완료 (2026-08-09)**: 관리자의 "강제 탈퇴"·"방 강제 삭제"가 걱정했던
> `rooms.owner_id ON DELETE CASCADE` 문제(계정 삭제/방 삭제가 아카이브 로직을 거치지 않고
> 대화 기록이 증발하는 문제)는 §Phase 7에서 `rooms`/`random_sessions` BEFORE DELETE
> 트리거로 해결되었다 — 삭제 경로(관리자 강제 삭제 포함)와 무관하게 아카이브가 항상
> 남으므로, 이 Phase의 강제 탈퇴/강제 삭제 기능은 별도 아카이브 처리 없이 그대로 구현해도
> 안전하다.

### 운영 기능

- [x] 대시보드 — 가입자 수, DAU, 진행 중인 방/랜덤 세션 수, 대기 중 신고 수 등 기본 지표. 진행 중인 방/세션 카드는 위 대화 조회 화면으로 바로 링크 (2026-08-13 확장 — 아래 "대시보드 확장" 절 참고: 실시간 접속 현황/현재 상태/오늘의 회원·채팅 활동 4개 섹션으로 재편, 방채팅 실시간 접속자 지표 추가)
- [x] 일자별 통계 히스토리 조회 (`/admin/stats`) — 대시보드 지표를 날짜 범위로 비교 조회 (최초 계획엔 없던 항목, 2026-08-13 사용자 요청으로 추가 — 아래 "대시보드 확장" 절 참고)
- [x] 방 강제 삭제 (부적절 콘텐츠 대응) — 아카이브 우회 문제는 위 "사용자 관리" 섹션의 경고 참고
- [x] 랜덤채팅 세션 강제 종료 — 방 강제 삭제와 대응되는 랜덤채팅 쪽 조치(최초 계획엔 없었음, 위 "대화 내용 조회"의 진행 중 세션 조회 추가와 함께 보완)
- [x] 신고 기능 및 신고 처리 큐 (사용자 신고 → 관리자 검토 → 조치) — 신고 접수 UI는 일반 사용자 화면에도 추가
- [x] 관리자 조치 감사 로그 (누가·언제·무엇을 — 조치만 기록, 단순 열람은 제외)
- [x] 시스템 상태 점검 — pg_cron 배치(게스트 정리, 아카이브 정리, 유령 세션 정리) 최근 실행 결과 확인

**연관 PRD**: §7.4 후속 검토(운영자 관리 화면), §7.1 권한 검증

**완료 조건**: 관리자 계정으로만 `/admin`에 접근 가능하고(일반 회원·게스트는 완전 차단, 서버 측에서도 재검증됨), 방채팅·랜덤채팅 각각 **진행 중/종료됨을 탭 하나로 오가며** 대화 내용과 전송 이미지를 조회할 수 있고, 날짜 범위 기반 메시지 검색이 동작하며, 회원 목록 조회와 최소 1개 이상의 제재 조치(정지 또는 강제 탈퇴)가 동작한다.

**설계 시 유의**:
- 개인정보(대화 내용) 열람 기능이므로 접근 권한을 최대한 좁히고, 열람 행위 자체를 감사 로그로 남기는 것을 기본으로 검토한다.
- 관리자 전용 조회 때문에 일반 사용자용 RLS 정책을 느슨하게 푸는 실수를 하지 않는다 — `is_admin()` 같은 SECURITY DEFINER 판별 함수를 별도로 두고 정책을 분리한다.
- 이 프로젝트에서 이미 겪은 RLS 재귀 문제(Phase 3 검증 참고)를 되풀이하지 않도록, 관리자 판별 함수가 `profiles`를 다시 참조할 때 재귀가 생기지 않는지 반드시 확인한다.

### 구현 완료 (2026-08-10)

계획(`DEVELOPMENT_PLAN.md` §Phase 7.5)대로 마이그레이션 9건 + 구현 중 추가된 1건(총 10건), `app/admin/*` 전 화면, `app/actions/admin.ts`, `app/actions/reports.ts`, `lib/queries/admin.ts`, `components/admin/*`, 일반 사용자 신고 진입점을 구현했다. `npm run check-all`, `npm run build` 통과 확인, `mcp__supabase__get_advisors`(security)로 신규 테이블/함수 점검 완료 — 새로 발견된 이슈 없음(기존에도 반복되던 "SECURITY DEFINER 함수를 authenticated가 실행 가능" 계열 INFO/WARN은 `join_room`/`kick_member` 등 기존 함수들과 동일한 이 프로젝트의 기존 패턴이라 별도 조치 없음).

계획 대비 달라진 점:

1. **마이그레이션 순서 재배치**: `DEVELOPMENT_PLAN.md` §7.5.2 원안은 `add_suspension_columns_to_profiles`(정지 컬럼 추가)를 `create_admin_read_functions`/`create_admin_action_functions`보다 뒤에 배치했지만, `admin_search_users()`/`admin_suspend_user()` 등이 그 컬럼을 참조하므로 먼저 적용해야 했다. 파일명은 계획과 동일하게 유지하고 적용 순서(타임스탬프)만 앞당겼다 — 계획을 그대로 따라 순서대로 적용했다면 컬럼이 없는 상태에서 함수 생성이 실패했을 것.
2. **`admin_get_room_members()` 함수 추가(계획에 없던 마이그레이션, `20260810090000`)**: 계획에는 "방별 메시지 타임라인 + 참여자 목록"만 명시돼 있었는데, `room_members` SELECT RLS(`DB_SCHEMA.md` §4)가 "같은 방 참여자만" 조회를 허용해 **관리자가 직접 참여하지 않은 방은 참여자 목록을 볼 수 없는 문제**가 구현 중 드러났다. `is_admin()`과 동일한 SECURITY DEFINER 패턴으로 `admin_get_room_members(p_room_id)`를 추가해 해결했다 — `is_admin()`류 판별 함수뿐 아니라, 관리자가 참여자 기준 RLS를 우회해서 봐야 하는 데이터마다 이런 전용 조회 함수가 필요할 수 있다는 걸 보여준 사례.
3. **신고 진입점(`report-button.tsx`) 구현 방식**: 계획에는 "일반 사용자 화면에 추가하는 신고 진입점"이라고만 돼 있었는데, `ChatHeader`의 "더보기" 드롭다운(`DropdownMenu`) 안에 `Dialog`를 직접 중첩하면 드롭다운이 닫히며 다이얼로그도 함께 닫히는 Radix 조합 문제가 있어, `components/rooms/report-button.tsx`/`components/random/report-button.tsx`는 자체 트리거 버튼 없이 `open`/`onOpenChange`로 제어되는 controlled dialog로 구현하고, 트리거는 `ChatHeader`의 드롭다운 메뉴 아이템이 상위 컴포넌트(`RoomChatView`/`RandomChatView`)의 상태를 통해 여는 방식으로 분리했다.
4. **회원 상세 화면의 "최근 대화 이력"**: 계획엔 "참여 중인 방, 최근 대화 이력, 신고 이력"으로 돼 있었지만, 실제로는 참여 중인 방 개수(`room_count`)와 신고 이력만 보여주고 방별 상세 링크는 만들지 않았다 — 대화 열람 자체는 이미 `/admin/rooms`·`/admin/random` 통합 조회 화면에서 검색으로 충분히 가능해, 회원 상세에 중복 UI를 또 만들지 않는 쪽을 택했다(시간 대비 가치 낮음 판단).
5. **관리자 계정 지정**: "1인 운영자를 SQL로 직접 지정"한다는 계획대로, 이번 구현 중 `rudvy9@gmail.com`(닉네임 `박경표2`) 계정의 `profiles.role`을 `admin`으로 직접 UPDATE했다. 다른 관리자가 필요하면 같은 방식으로 SQL을 다시 실행하면 된다.

**실제 브라우저 검증 및 버그 수정 (2026-08-09, 구현 담당과 별도 세션에서 직접 진행)**: 위 구현을 별도 worktree에서 병합해온 뒤, 서비스 롤 키로 관리자 계정(`rudvy9@gmail.com`)과 비관리자 계정(`kyu275`) 각각의 매직링크(`auth.admin.generateLink` + `/auth/confirm?token_hash=...`)를 발급해 실제 로그인 세션으로 Playwright 전체 화면을 순회 검증했다. `npm run check-all`/`npm run build`만으로는 잡히지 않는 런타임 버그 2건을 발견해 수정했다:

1. **`/admin/rooms`(및 `/admin/random`, `/admin/users`, `/admin/reports`) 500 에러 — Server→Client 컴포넌트 경계에 함수를 넘길 수 없는 문제**. `components/admin/data-table.tsx`가 `"use client"`인 상태로 각 페이지(Server Component)가 만든 `columns[].render` **함수**를 prop으로 받고 있었다(`Functions cannot be passed directly to Client Components` 에러). `DataTable`에서 `"use client"`를 제거해 일반 함수(서버에서 직접 실행)로 바꾸고, 실제 클라이언트 상호작용(검색 인풋의 라우팅)만 `components/admin/data-table-search-input.tsx`라는 별도 Client Component로 분리했다 — 사용되지 않던 `onRowClick` prop(함수, 동일한 경계 문제 소지)도 함께 제거. `DataTable`을 사용하는 4개 목록 화면(방채팅/랜덤채팅/회원/신고) 전부가 이 한 번의 수정으로 복구됐다.
2. **방/세션 상세 화면 hydration mismatch** — `components/admin/message-timeline.tsx`가 `formatChatTime()`(`ko-KR` 로케일 명시)로 메시지 시각을 표시하는데, 서버(Node ICU)와 브라우저의 로케일 포맷 결과가 달라(`PM 1:10` vs `오후 1:10`) React가 hydration mismatch 경고를 내고 있었다. 시각 표시값은 사용자에게 큰 의미가 없는 사소한 차이라 판단해 해당 `<span>`에 `suppressHydrationWarning`을 추가(React 공식 권장 패턴)했다. 같은 현상이 일반 방채팅/랜덤채팅 화면(`ChatMessageBubble`)에서도 재현되는 것을 테스트 중 우연히 발견했는데, 이는 Phase 7.5 범위 밖의 기존(pre-existing) 이슈라 이번엔 손대지 않았다 — 필요 시 별도 Phase나 버그 티켓으로 다룰 것.

수정 후 `npm run check-all`/`npm run build` 재통과 확인. 이어서 다음 시나리오를 SQL(`execute_sql`)과 Playwright로 실제 검증:
- 대시보드 실데이터(가입 회원/게스트/DAU/진행 중인 방·세션/오늘 메시지/대기 신고 수) 표시 확인
- 방채팅 "진행 중"/"종료됨" 탭 전환, 방 상세(메시지 타임라인 + 참여자 목록 + "탈퇴한 사용자" 표시) 확인
- 계정 정지 → `join_room()`을 SQL로 해당 사용자 권한 흉내내 직접 호출해 `user_suspended` 예외로 거부되는지 확인(`is_user_suspended()` 결과 및 `admin_audit_logs` 기록도 함께 대조) → 정지 해제까지 정상 확인
- 비로그인 사용자의 `/admin` 접근 → 미들웨어가 `/auth/login`으로 리다이렉트(307), 로그인했지만 관리자가 아닌 사용자(`kyu275`)의 `/admin` 접근 → 레이아웃이 정확히 404 반환
- 일반 사용자 화면(방채팅) "더보기 → 신고하기" → 다이얼로그 정상 오픈(Radix 중첩 우회 설계 확인) → 신고 접수 → `reports` 테이블에 실제 INSERT 확인 → 관리자 신고 큐에 노출 → 상세에서 "처리 완료" → 상태가 `resolved`로 정상 전환
- 시스템 상태 화면에서 pg_cron 배치 실행 이력 실데이터 확인
- 메시지 검색(키워드+날짜 범위)이 진행 중 메시지뿐 아니라 `room_archives`/`random_session_archives`의 jsonb 아카이브까지 실제로 매칭해 결과를 반환하고, 결과 클릭 시 해당 방/세션(또는 아카이브) 상세로 이동하는 것까지 확인

**알려진 사소한 한계 (이번엔 손대지 않음)**: `/admin/reports` 목록의 검색 인풋 placeholder가 "검색 (미구현)"으로 돼 있어 실제로는 검색어 필터링이 동작하지 않는다 — 신고 건수가 적은 초기 단계에서는 영향이 작다고 판단해 이번 Phase 완료 조건에서는 보류, 필요 시 후속으로 구현.

### 대시보드 확장 (2026-08-13)

2026-08-10 구현 완료 이후, 실사용 중 사용자 피드백을 반영해 대시보드/통계 기능을 여러 차례 확장했다. 계획 문서에는 없던 신규 범위라 별도로 기록한다.

1. **일별 히스토리 저장 체계 신설**: 기존 대시보드는 "지금 이 순간"의 라이브 값만 보여줘 날짜별/기간별 비교가 불가능했다. `daily_active_users`(회원+게스트 일일 활동 로그, 400일 보존)와 `admin_daily_stats`(지표 스냅샷 테이블) 두 테이블을 신설하고, 매일 23:55 pg_cron(`record-daily-stats-snapshot`)이 그날의 스냅샷을 기록한다. "오늘"은 항상 라이브 계산값, 과거 날짜는 스냅샷값을 조회하는 `admin_get_daily_stats(date_from, date_to)` RPC와 `/admin/stats` 화면(최근 7일 기본 표시)을 신설했다. flow 지표(방 생성/삭제 건수 등)는 원본 테이블 타임스탬프에서 언제든 재집계 가능하지만, stock/snapshot 지표(접속자 수 등)는 그 순간이 지나면 다시 구할 수 없어 스냅샷 저장이 필수라는 점이 설계의 핵심이었다.
2. **대시보드 지표 구성 재편**: "현재 상태"/"오늘의 활동" 2섹션 구조가 "총 숫자"와 "날짜 기준 값"을 섞어놓아 헷갈린다는 피드백에 따라, 다시 4섹션(실시간 접속 현황 / 현재 상태 / 오늘의 회원 활동 / 오늘의 채팅 활동)으로 재편했다. "실시간 접속 현황"은 하트비트 신선도 윈도우에 의존하는 지표(실시간 접속자·방채팅 실시간 접속자·랜덤채팅 매칭자·대기자)만 따로 모으고, "현재 상태"는 `COUNT(*)`로 신선도 판정 없이 항상 정확한 단순 집계(총 회원·게스트 수·대기 신고·방채팅 수)로 분리했다 — 이 구분 자체가 사용자 피드백("완전 실시간 정보용 데이터랑 아닌 거랑 구분")으로 도출됐다. 라벨도 "가입 회원 수"→"총 회원", "DAU"→"서비스 이용자" 등으로 단순화했고, 화면에서 안 쓰는 방/랜덤 메시지 수 카드는 제거했다.
3. **탈퇴 회원 집계**: 계정 탈퇴(자진/관리자 강제 모두 `auth.admin.deleteUser()`로 귀결)가 `auth.users`를 물리 삭제해 이력이 전혀 안 남는 문제를 발견했다. `handle_new_user()`(가입 트리거)와 대칭되는 `auth.users` AFTER DELETE 트리거(`log_account_deletion()`)를 추가해 `account_deletions` 로그 테이블에 삭제 시점을 남기고, "신규 회원"(`profiles.created_at` 기준)과 함께 "오늘의 회원 활동" 섹션에 추가했다.
4. **방채팅 실시간 접속자**: 랜덤채팅과 달리 방채팅은 방 하나당 Supabase Realtime Presence 채널로만 접속 여부를 추적해(`lib/realtime/presence.ts`) DB에 아무 흔적이 안 남고, 사이트 전역에서 "지금 방채팅 중인 사람 수"를 집계할 방법이 없었다. 랜덤채팅이 겪었던 것과 같은 이유(네트워크 순단 시 presence 이벤트 유실, §Phase 5.5)로 presence 단독이 아닌 하트비트 방식을 채택 — `profiles.room_heartbeat_room_id`/`room_heartbeat_at` 컬럼과 `heartbeat_room_presence(p_room_id)` RPC(본인 것만 갱신, `room_members` 멤버십 재검증)를 추가하고, 방채팅 화면이 열려 있는 동안 사이트 전역 하트비트와 동일한 주기(60초/2분 신선도)로 갱신한다. 게스트는 방채팅 참여가 애초에 차단돼 있어 `profiles`만 대상으로 한다.

모두 `npm run check-all`/`npm run build` 통과, `mcp__supabase__get_advisors`(security) 점검 완료(신규 이슈 없음), Playwright로 실제 관리자 로그인 후 각 화면 동작 확인까지 마쳤다.

---

## Phase 7.6 — 실사용 안정화 (로그인/방채팅/관리자 통계) (완료, 2026-08-14)

Phase 7.5 완료 이후 실사용 중 발견된 버그·UX 요청을 모아 처리했다. 새 기능 확장이 아니라
이미 완료된 Phase(0/3/7/7.5)의 사후 안정화 성격이라 별도 번호로 분리해 기록한다.

- [x] 방장 1인 1방 제한 + 브라우저 종료 시 자동 종료 기능 시도 → 안정성 문제로 원복, "1인 최대 3방" 제한으로 대체
- [x] 로그아웃 시 로그인 페이지 대신 홈 화면으로 이동
- [x] 구글 로그인 후 `http://0.0.0.0:3000/`으로 빠지는 문제 수정
- [x] 방채팅 최대 인원을 4개 고정 옵션 대신 2~50명 자유 입력으로 변경
- [x] 공개방은 "입장하기" 화면 없이 클릭 즉시 입장, 강퇴된 사용자는 별도 화면 없이 즉시 안내
- [x] "내가 참여중인 방" 목록에 방장 표시 배지 추가
- [x] 관리자 대시보드 "신규 방채팅"이 삭제 시 함께 줄어들던 집계 오류 수정
- [x] 비공개방 비밀번호가 정확히 입력해도 항상 실패하던 버그 수정

**① 방장 1인 1방 + 자동 종료 기능 구현 후 원복**: "한 사람이 방을 여러 개 만들어 관리가
혼란스럽다"는 문제 제기로 방장 1인 1방 제한(`rooms.owner_id` unique 제약) + 브라우저
종료(presence/하트비트 기반) 시 방 자동 종료 기능을 구현했다. Realtime presence 동기화
불안정(§Phase 5.5에서 이미 겪은 것과 같은 종류), 방장 혼자 있다가 브라우저를 닫으면
최대 75초간 방이 목록에 좀비 상태로 남는 문제, `sendBeacon`/`pagehide`가 best-effort라
모바일에서 신뢰할 수 없는 점 등이 반복 발견되어 근본 해결책(읽기/쓰기 시점 재검증 설계)까지
검토했으나, 최종적으로 **"자동 종료 자체를 하지 않는" 단순한 방향으로 원복**하기로
결정했다. 대신 "한 사람이 방을 너무 많이 만드는" 원래 문제는 **1인 최대 3방** 제한
(`enforce_max_rooms_per_owner` BEFORE INSERT 트리거)으로 대체했다. 방은 오직 방장이
"나가기"를 눌렀을 때만 삭제된다(기존 `leave_room()` 그대로). 관련 마이그레이션은
`supabase/migrations/20260814000000_*`~`20260814050000_*`(기능 구현)과
`20260814080000_revert_owner_offline_auto_close_to_manual_leave_only.sql`(원복)
참고 — 구현 중 만들었던 `remove_offline_member()`/`close_abandoned_owner_rooms()`
cron·함수, `lib/utils/device.ts`, `/api/beacon-leave`는 원복하며 전부 삭제했다.

**② 로그인/로그아웃 UX**: `signOut()`(`app/actions/auth.ts`)의 리다이렉트 대상을
`/auth/login` → `/`로 변경. 구글 로그인 후 `http://0.0.0.0:3000/`으로 빠지는 문제는
Playwright로 실제 로그인 흐름을 끝까지 재현해 원인을 특정했다 — Supabase에 전달하는
`redirect_to`는 항상 정확했지만(대시보드 Redirect URLs 설정 문제 아님), 개발 서버가
`0.0.0.0`으로 바인드된 환경에서 `app/auth/callback/route.ts`가 `new URL(request.url).origin`으로
계산한 값이 브라우저의 실제 요청 host(`localhost:3000`)와 다르게 `0.0.0.0:3000`으로
나오는 것이 원인이었다. 콜백 라우트와 `lib/auth/oauth.ts`(`signInWithGoogle`) 양쪽에서
origin의 `0.0.0.0`을 `localhost`로 정규화하도록 수정, Playwright로 정상 리다이렉트까지
재검증했다.

**③ 방채팅 UX 3건**: 최대 인원을 `lib/schemas/room.ts`/`components/rooms/create-room-form.tsx`에서
고정 4옵션(5/10/20/50) → 2~50명 자유 입력(DB `max_members between 2 and 50` 제약과 일치)으로
변경. `/rooms/[roomId]` 페이지가 비회원이고 공개방이면 "입장하기" 화면 대신 서버에서 바로
`join_room()`을 호출해 즉시 채팅방을 보여주도록 변경(비공개방은 비밀번호 입력이 필수라
제외) — 이 김에 강퇴된 사용자도 같은 사전 호출로 밴 여부를 미리 판별해, "입장하기" 화면을
거치지 않고 곧바로 "강퇴된 방에는 다시 입장할 수 없습니다" 안내만 보여주도록 통일했다.
`lib/queries/rooms.ts`에 `ownerId`를 추가하고 `components/rooms/room-card.tsx`가 본인
소유 방에 "내가 만든 방" 배지를 표시하도록 했다.

**④ 관리자 대시보드 "신규 방채팅" 집계 오류**: `admin_compute_live_stats()`의
`rooms_created` 계산이 `rooms` 테이블(현재 존재하는 행)만 세고 있어, 같은 날 만들었다가
삭제한 방은 카운트에서 빠지는 문제였다. `rooms_deleted`가 이미 쓰던 append-only
`room_archives` 테이블을 함께 합산하도록 수정(`random_sessions_matched`가 쓰던
활성+아카이브 합산 패턴 재사용). 방 생성→삭제 실제 테스트로 카운트가 유지되는 것을
확인했다. 마이그레이션: `20260814090000_fix_rooms_created_today_to_include_archived.sql`.

**⑤ 비공개방 비밀번호 검증 실패 버그**: 비밀번호를 정확히 입력해도 항상 "비밀번호가
올바르지 않습니다"로 실패하는 문제를 SQL로 직접 재현해 원인을 확정했다 — `createRoomAction`이
`bcryptjs`로 만드는 해시가 `$2b$` 버전 태그를 쓰는데, Supabase pgcrypto의 `crypt()`가
이 태그를 인식하지 못해 자기 자신이 만든 `$2a$` 해시는 검증에 성공하면서도 `$2b$` 해시는
항상 불일치로 판정하고 있었다(`$2a$`/`$2b$`는 해시 알고리즘은 동일하고 버전 태그만 다름).
`app/actions/rooms.ts`에서 해시 생성 직후 태그를 `$2a$`로 정규화하도록 수정하고, 이미
만들어져 있던 비공개방들의 저장된 해시도 태그만 정규화해 즉시 복구했다(내용은 그대로라
비밀번호 재설정 불필요). 마이그레이션:
`20260814100000_fix_bcrypt_2b_hash_prefix_incompatible_with_pgcrypto_crypt.sql`.

모두 `npm run typecheck`/`npm run lint` 통과 확인, Playwright로 구글 로그인·방 생성·
비공개방 비밀번호 검증까지 실제 재현 테스트로 확인했다.

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
- [ ] Vercel Cron 등록 — `cleanup-chat-images` (Phase 6에서 엔드포인트만 만들고 스케줄 등록은 이월된 항목)
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
- [ ] ~~운영자 관리 화면~~ → Phase 7.5로 승격 (MVP 범위에 포함)
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
| 6 | 이미지 전송 | 완료 |
| 7 | 권한 검증/계정 관리 | 완료 |
| 7.5 | 관리자 페이지(사이트 운영) | 완료 |
| 7.6 | 실사용 안정화(로그인/방채팅/관리자 통계) | 완료 |
| 8 | UI/UX 마감·반응형 | 미착수 |
| 9 | 배포 | 미착수 |
| 10 | 후속 검토 (범위 외) | 미착수 |
