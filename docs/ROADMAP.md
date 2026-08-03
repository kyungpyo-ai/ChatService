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
- [x] DEVELOPMENT_PLAN.md — Phase별 세부 태스크, 파일 단위 작업 목록 (Phase 2 상세, 이후 Phase는 착수 시 갱신)

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

---

## Phase 5 — 랜덤채팅 (텍스트)

방채팅에서 검증한 실시간 메시지 파이프라인을 재사용해, 매칭 로직만 추가로 구현한다. Phase 2의 매칭 대기/랜덤채팅 화면에 데이터를 연결한다.

- [ ] DB: `random_queue`, `random_sessions` 테이블 + RLS
- [ ] 게스트 임시 ID 발급 (세션 기반)
- [ ] 매칭 대기열 진입/취소
- [ ] 서버/DB 트랜잭션 기반 매칭 로직 (중복 매칭 방지)
- [ ] 1:1 랜덤채팅 화면에 텍스트 메시지, 종료·재매칭 연결
- [ ] 매칭 이탈 시 대기열 정리

**연관 PRD**: §4.2 RND-01~03, RND-05

**완료 조건**: 서로 다른 두 브라우저가 로그인 없이 매칭되고 실시간 텍스트 대화 후 정상 종료된다.

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

**연관 PRD**: §7.2 배포, §7.3 개발 순서

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
| 5 | 랜덤채팅(텍스트) | 미착수 |
| 6 | 이미지 전송 | 미착수 |
| 7 | 권한 검증/계정 관리 | 미착수 |
| 8 | UI/UX 마감·반응형 | 미착수 |
| 9 | 배포 | 미착수 |
| 10 | 후속 검토 (범위 외) | 미착수 |
