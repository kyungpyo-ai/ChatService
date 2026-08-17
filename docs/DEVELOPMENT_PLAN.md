# 수다온(sudaon) 개발 계획

> 이 문서는 `ROADMAP.md`의 Phase를 실제 파일/컴포넌트/함수 단위 태스크로 분해한 것이다. **바로 착수하는 Phase만 상세히 작성**하고, 이후 Phase는 착수 직전에 이 문서를 갱신해 상세화한다 — 먼 미래 Phase를 지금 촘촘히 계획해봐야 실제 착수 시점에 요구사항/설계가 바뀔 가능성이 크기 때문이다.

- 상세 작성됨: **Phase 2 — UI 뼈대 및 디자인 시스템**, **Phase 3 — 방채팅(텍스트)**, **Phase 4 — 방 나가기/온라인 상태/사용자 검색**, **Phase 5 — 랜덤채팅(텍스트)**, **Phase 5.5 — 랜덤채팅 Presence 기반 재설계**, **Phase 6 — 이미지 전송**, **Phase 7 — 권한 검증 및 계정 관리**, **Phase 7.5 — 관리자 페이지(사이트 운영)**, **Phase 7.7 — 법적/규정 준수**
- 개요만 있음: Phase 8~10 (해당 Phase 착수 시 이 문서에 상세 추가)

---

## Phase 2 — UI 뼈대 및 디자인 시스템 (상세)

### 참고 디자인

`docs/UIUX/UIUXSample.png`(v1) → `docs/UIUX/UXUI Sample2.png`(v2, 최신)로 수정됨. 이 문서의 컴포넌트/토큰은 **v2 기준**으로 작성한다. 실제 구현 시 샘플을 픽셀 단위로 복제하기보다 톤·구조·인터랙션 패턴을 따르고, shadcn/ui(new-york) 컴포넌트 위에서 모던한 트렌드(부드러운 그림자, 큰 라운드 코너, 넉넉한 여백)로 다듬는다.

**v1 → v2 변경점** (아래 §2.3/§2.4에 반영됨):

- 홈 CTA가 정사각 카드 2개(좌우 배치) → **가로로 긴 리스트형 카드**(좌측 아이콘 + 제목/부제 + 우측 화살표)로 변경
- 홈 AD 배너 아래에 **게스트/회원 이용 안내 문구 블록** 추가 ("로그인 없이 랜덤채팅 가능" / "로그인하면 방채팅과 사용자 검색 이용 가능")
- 매칭 대기 화면에 **경과 시간 타이머(00:18)** + **평균 매칭 시간 안내 문구** 추가, 헤더 라벨이 "신고"→"안심"으로 변경
- 방 목록의 비밀방 카드에 자물쇠 배지가 더 명확히 표시됨 (기존 §2.3 `RoomCard` 설계와 일치, 변경 없음)
- 사용자 검색의 "최근 검색" 영역에 **전체 삭제** 버튼 추가
- 방채팅 공지 배너에 펼침용 화살표(`>`) 추가 — 공지는 헤더와 분리된 별도 바로 취급
- PC 사이드바 하단에 **로그인/회원가입 버튼 + 설정 아이콘 + 다크모드 토글**이 명시적으로 추가됨 → 기존 `components/theme-switcher.tsx`(`ThemeSwitcher`)를 그대로 재사용
- 모바일 홈 화면에는 v1에 있던 하단 "로그인/회원가입" 버튼이 v2 목업에서 보이지 않음 — 화면 공간 절약을 위해 모바일은 로그인 진입점을 헤더 아바타 클릭 또는 "내 정보" 탭으로 일원화하는 것으로 해석하고 구현한다 (비로그인 시 헤더 아바타/내정보 탭 클릭 → `/auth/login` 이동)

### 2.1 디자인 토큰

`app/globals.css`의 Tailwind CSS 변수에 추가/조정한다. 기존 다크모드 인프라(`next-themes`)는 유지하되, PRD §6.1(화이트톤 기본 + 단일 강조색) 원칙에 따라 라이트 모드를 기준으로 설계하고 다크 모드는 동일 톤의 어두운 버전으로 자동 대응한다.

| 토큰 | 값 (라이트) | 용도 |
|---|---|---|
| `--brand` | `oklch(0.55 0.22 275)` (인디고-바이올렛, Tailwind `indigo-600` 근사) | 주요 버튼, 활성 탭, 내 메시지 버블, 강조 텍스트 |
| `--brand-foreground` | `oklch(0.98 0 0)` (거의 흰색) | 브랜드 배경 위 텍스트 |
| `--brand-muted` | `oklch(0.94 0.03 275)` (연한 인디고, `indigo-50` 근사) | 최근 검색 칩, 선택된 카테고리 배경 |
| `--surface` | `oklch(1 0 0)` (흰색) | 카드/시트 배경 |
| `--surface-muted` | `oklch(0.97 0 0)` (`gray-50` 근사) | 페이지 배경, 상대방 메시지 버블 |
| `--radius-card` | `1rem` (`rounded-2xl`) | 카드, 방 목록 아이템, 시트 |
| `--radius-bubble` | `1.25rem` | 채팅 말풍선 |
| `shadow-card` | Tailwind `shadow-sm` | 카드 전반 (과한 그림자 지양 — 모던 트렌드는 그림자보다 여백/보더로 구분) |

- 폰트는 기존 Geist Sans 유지.
- 방 카드의 이모지 아이콘 배경은 고정 브랜드색이 아닌 파스텔 순환 팔레트(연보라/연분홍/연하늘/연노랑)를 사용해 목록에 리듬감을 준다 — `lib/utils/avatar-color.ts`류 유틸로 room id 해시 기반 색 배정.

### 2.2 공용 레이아웃 구조

기존 `ARCHITECTURE.md` §3의 라우팅 스케치를 아래처럼 **route group**으로 구체화한다 (URL 경로는 동일, 공용 레이아웃만 추가).

```
app/
  (main)/                        # 헤더+네비가 필요한 모든 화면의 route group
    layout.tsx                   # AppHeader + BottomNav(모바일) / SidebarNav(PC)
    page.tsx                     # 홈
    random/
      page.tsx                   # 매칭 대기
      [sessionId]/page.tsx       # 랜덤채팅
    rooms/
      page.tsx                   # 방 목록
      new/page.tsx               # 방 생성
      [roomId]/page.tsx          # 방채팅
    search/
      page.tsx                   # 사용자 검색
    profile/
      page.tsx                   # 내 정보 (닉네임/사진/계정탈퇴 — 기존 setup-profile과 별도)
```

`app/auth/*`는 기존과 동일하게 `(main)` 그룹 밖에 유지(헤더/네비 없는 인증 전용 레이아웃).

### 2.3 신규 컴포넌트 목록

| 컴포넌트 | 경로 | 설명 |
|---|---|---|
| `AppHeader` | `components/layout/app-header.tsx` | 로고 "💬 수다온", 알림 벨, 아바타. 모바일 상단 전용(PC는 각 화면 헤더가 대체하거나 생략) |
| `BottomNav` | `components/layout/bottom-nav.tsx` | 모바일 전용 하단 고정 5탭 (홈/랜덤채팅/방목록/검색/내정보), `md:hidden` |
| `SidebarNav` | `components/layout/sidebar-nav.tsx` | PC 전용 좌측 고정 네비. 상단 로고+메뉴 5개, 하단에 `AdBanner`(sidebar variant) → 로그인/회원가입 버튼(비로그인 시) → 설정 아이콘 + `ThemeSwitcher`(기존 컴포넌트 재사용) 행. `hidden md:flex` |
| `AdBanner` | `components/layout/ad-banner.tsx` | 광고 영역 placeholder (props로 위치 variant: `inline` \| `sidebar`) |
| `HeroActionRow` | `components/home/hero-action-row.tsx` | 홈의 "랜덤채팅 시작하기"/"채팅방 둘러보기" CTA — 가로로 긴 행 카드(좌측 아이콘 원, 중앙 제목+부제, 우측 화살표). 세로로 2개 스택 |
| `AccessInfoList` | `components/home/access-info-list.tsx` | 홈 AD 배너 하단, 게스트/회원 이용 범위 안내 2줄 리스트 (아이콘 + 텍스트) |
| `MatchingIndicator` | `components/random/matching-indicator.tsx` | 매칭 대기 펄스 애니메이션 원형 인디케이터(`animate-ping`) + 하단 경과 시간 타이머(`00:18`, `setInterval` 클라이언트 상태) + 평균 매칭 시간 안내 문구 |
| `RoomCard` | `components/rooms/room-card.tsx` | 방 목록 아이템 (이모지 아이콘, 제목, 설명, 인원 `n/max`, 비밀방 자물쇠 배지) |
| `RoomListSearchBar` | `components/rooms/room-list-search-bar.tsx` | 방 목록 상단 검색창 + "방 만들기"(모바일) / "새 방 만들기"(PC) 버튼 |
| `ChatHeader` | `components/chat/chat-header.tsx` | 채팅 화면 상단 (제목, 인원, 더보기 메뉴) — 방채팅/랜덤채팅 공통 |
| `PinnedNoticeBar` | `components/chat/pinned-notice-bar.tsx` | 방채팅 헤더 아래 고정 공지 배너, 펼침용 화살표(`>`) 포함 — 클릭 시 공지 상세 표시(Phase 2에서는 UI만) |
| `ChatMessageBubble` | `components/chat/chat-message-bubble.tsx` | 텍스트/이미지 메시지 버블, `variant: "me" \| "other"`, 발신자 아바타+닉네임+시각 |
| `ChatInputBar` | `components/chat/chat-input-bar.tsx` | 하단 고정 입력창 (이미지 첨부 `+`, 텍스트 인풋, 이모지, 전송 버튼). 전송 버튼은 모바일 아이콘 전용, PC는 아이콘+"전송" 텍스트 라벨 variant |
| `ParticipantList` | `components/rooms/participant-list.tsx` | 방채팅 참여자 패널 (PC: 우측 패널 / 모바일: 별도 시트) |
| `SearchInput` | `components/search/search-input.tsx` | 닉네임 검색 인풋 |
| `RecentSearchChips` | `components/search/recent-search-chips.tsx` | 최근 검색어 칩 목록 + 우측 상단 "전체 삭제" 텍스트 버튼 |
| `UserSearchResultItem` | `components/search/user-search-result-item.tsx` | 검색 결과 행 (아바타, 닉네임, 나이, 온라인 점, chevron) |

기존 shadcn 컴포넌트(`button`, `card`, `input`, `avatar`, `badge`, `dialog`, `dropdown-menu`, `skeleton`)와 기존 프로젝트 컴포넌트(`components/theme-switcher.tsx`)를 최대한 재사용하고, 목록에 없는 요소(펄스 인디케이터+타이머, 채팅 버블, 하단 네비)만 신규 작성한다.

### 2.4 화면별 작업 (더미 데이터로 렌더링, 실제 로직 없음)

| 화면 | 파일 | 더미 데이터 소스 |
|---|---|---|
| 홈 | `app/(main)/page.tsx` | 없음 (정적) |
| 매칭 대기 | `app/(main)/random/page.tsx` | 없음 (정적 상태) |
| 랜덤채팅 | `app/(main)/random/[sessionId]/page.tsx` | `lib/mock/messages.ts` |
| 방 목록 | `app/(main)/rooms/page.tsx` | `lib/mock/rooms.ts` |
| 방 생성 | `app/(main)/rooms/new/page.tsx` | 없음 (폼만) |
| 방채팅 | `app/(main)/rooms/[roomId]/page.tsx` | `lib/mock/messages.ts`, `lib/mock/participants.ts` |
| 사용자 검색 | `app/(main)/search/page.tsx` | `lib/mock/users.ts` |
| 내 정보 | `app/(main)/profile/page.tsx` | 로그인 사용자 프로필(실제 `profiles` 조회는 이미 있는 쿼리 재사용 — 유일하게 실제 데이터 연결) |

`lib/mock/*.ts`는 Phase 3 이후 실제 쿼리로 교체되며 삭제 대상 — 파일 상단에 `// TODO(Phase 3~5): 실제 데이터 연결 후 제거` 표시.

### 2.5 반응형 규칙

- 브레이크포인트: Tailwind 기본 `md`(768px) 기준으로 모바일/PC 전환
- 모바일(`< md`): 단일 열, `BottomNav` 고정, 참여자 목록은 `Sheet`(다이얼로그)로 분리
- PC(`≥ md`): `SidebarNav` 고정 좌측, 중앙 콘텐츠 `max-w-2xl` 정도로 제한, 방채팅에서만 우측 참여자 패널 상시 노출
- 채팅 입력창은 두 환경 모두 화면(또는 카드) 하단 고정 (`sticky bottom-0`)

### 2.6 완료 조건

- 8개 화면(홈, 매칭대기, 랜덤채팅, 방목록, 방생성, 방채팅, 검색, 내정보) 모두 더미 데이터로 모바일/PC 뷰포트에서 레이아웃 깨짐 없이 렌더링
- 홈~각 화면 간 네비게이션(하단 탭/사이드바 클릭)이 실제로 라우팅됨
- 디자인 토큰이 `globals.css`에 반영되어 모든 신규 컴포넌트가 하드코딩 색상 없이 토큰을 사용
- PC `SidebarNav` 하단의 `ThemeSwitcher`로 라이트/다크 전환 시 신규 컴포넌트(카드, 버블, 배지 등) 모두 정상적으로 톤이 바뀜

---

## Phase 3 — 방채팅 (텍스트) (상세)

### 3.0 범위와 제외

이번 Phase는 `ROADMAP.md` Phase 3의 5개 항목(테이블+RLS, 방 목록 조회, 방 생성, 방 입장, 텍스트 메시지 Realtime 송수신, 참여자 목록 연결)만 다룬다. 아래는 스키마상 관련되어 보이지만 **의도적으로 이번 Phase에서 제외**한다.

| 제외 항목 | 이유 / 실제 착수 시점 |
|---|---|
| `kick_member()` 함수, 강퇴 UI 로직 연결 | `ROADMAP.md` Phase 7(권한 검증 및 계정 관리)에서 서버 측 권한 재검증과 함께 구현 |
| 이미지 메시지 전송 (`content_type = 'image'`) | Phase 6. 이번 Phase는 텍스트만, `messages` 테이블 자체는 이미지 컬럼 구조까지 포함해 한 번에 만든다(재마이그레이션 방지) |
| `random_queue` / `random_sessions` | Phase 5 |
| 메시지 전송/방 생성 rate limit | Phase 7 |

### 3.1 설계 보완 — 방 생성 시 owner를 `room_members`에 자동 등록

`DB_SCHEMA.md` §4는 `room_members`에 대한 `authenticated`의 INSERT/UPDATE/DELETE를 전부 REVOKE하고 "입장/강퇴는 `join_room()`/`kick_member()` 함수로만" 이라 명시했지만, **방을 처음 만든 방장을 참여자로 넣는 경로가 어디에도 없다** — `join_room()`은 이미 있는 방에 들어가는 함수이지 방 생성과 무관하다. 이를 `rooms` INSERT 트리거로 보완한다 (기존 `handle_new_user()` 트리거와 동일한 패턴):

```sql
create or replace function public.handle_new_room()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.room_members (room_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

create trigger on_room_created
  after insert on public.rooms
  for each row execute function public.handle_new_room();
```

`security definer`이므로 `room_members`에 대한 REVOKE와 무관하게 동작한다. `DB_SCHEMA.md` §4에 이 트리거를 추가 반영해둔다.

### 3.2 DB 마이그레이션 (Supabase MCP `apply_migration`으로 순차 적용, 파일은 `supabase/migrations/`에 동기화)

| # | 파일명 | 내용 |
|---|---|---|
| 1 | `20260727000000_add_chat_columns_to_profiles.sql` | `DB_SCHEMA.md` §1 중 `gender`/`age`를 제외한 나머지 — `is_anonymous`, `last_seen_at` 컬럼 추가, `pg_trgm` 확장 + `profiles_username_trgm_idx` 생성, `handle_new_user()`에 `is_anonymous` 반영 (gender/age는 이전 Phase에서 이미 마이그레이션 적용됨 — 재적용하지 않음) |
| 2 | `20260727010000_create_rooms_table.sql` | `rooms` 테이블 + RLS + `password_hash` REVOKE (§3) |
| 3 | `20260727020000_create_room_members_table.sql` | `room_members` 테이블 + RLS + REVOKE (§4) |
| 4 | `20260727030000_create_room_owner_trigger.sql` | 위 §3.1의 `handle_new_room()` 트리거 (신규 설계, DB_SCHEMA.md 미기재분) |
| 5 | `20260727040000_create_room_bans_table.sql` | `room_bans` 테이블 + RLS만 생성 (§5) — `kick_member()` 함수는 Phase 7에서 추가, 이번 Phase는 `join_room()`이 참조할 빈 테이블만 필요 |
| 6 | `20260727050000_create_messages_table.sql` | `messages` 테이블 + RLS 전체 (§7) — `content_type='image'` 케이스 포함 구조로 한 번에 생성, 실제 이미지 전송 로직은 Phase 6 |
| 7 | `20260727060000_create_join_room_function.sql` | `join_room(p_room_id uuid, p_password text)` SECURITY DEFINER 함수 (§8) — 정원 확인 → `room_bans` 확인 → 비공개방이면 비밀번호 해시 검증 → `room_members` INSERT |

마지막에 `mcp__supabase__generate_typescript_types`로 `lib/supabase/database.types.ts` 재생성 (`npm run db:types` 대응).

### 3.3 신규 의존성

- `bcryptjs` — 비밀번호방 해시 저장/검증용 (`DB_SCHEMA.md` §5.1 정책). Node.js 런타임에서만 동작하는 서버 액션 내부에서만 사용하고 클라이언트 번들에 포함되지 않도록 `app/actions/rooms.ts`에서만 import한다. 네이티브 바인딩이 있는 `bcrypt` 대신 순수 JS 구현체를 선택해 Windows 로컬 빌드/Vercel 배포 양쪽에서 추가 빌드 설정 없이 동작하게 한다.

### 3.4 신규/변경 파일

| 파일 | 상태 | 설명 |
|---|---|---|
| `lib/schemas/room.ts` | 신규 | 방 생성 zod 스키마 — `title`(1~50자), `maxMembers`(2~50, select라 문자열로 받아 숫자 검증), `isPrivate`(boolean), `password`(선택, `isPrivate`이면 4~20자 필수 — `superRefine`으로 조건부 검증. `lib/schemas/profile.ts`에서 확립한 "coerce 금지, 문자열 유지 후 서버에서 변환" 패턴 재사용) |
| `lib/queries/rooms.ts` | 신규 | `getRoomList()`, `getRoomDetail(roomId)`, `getRoomMembers(roomId)`, `getMyRoomMembership(roomId)` — Server Component 전용 읽기 함수, `lib/queries/profile.ts`와 동일하게 `createClient()`(server) 사용. **2026-08-03 추가**: `getMyRoomList(userId)` — `room_members!inner` embed-filter로 내가 속한 방만 조회, `getRoomList()`와 동일한 필드 구성 재사용 |
| `app/actions/rooms.ts` | 신규 | `createRoomAction`, `joinRoomAction` 서버 액션. `createRoomAction`: 로그인 확인(+ `is_anonymous`면 거부, ROOM-02) → zod 검증 → `isPrivate`면 `bcryptjs.hash()` → `rooms` INSERT(트리거가 owner를 room_members에 자동 등록) → 생성된 방으로 redirect. `joinRoomAction`: 로그인 확인 → `supabase.rpc("join_room", {...})` 호출 → 성공 시 redirect, 실패 사유(정원 초과/비밀번호 오류/강퇴 이력)를 폼 상태로 반환 |
| `app/actions/messages.ts` | 신규 | `sendRoomMessageAction(roomId, content)` — 로그인 확인 → `messages` INSERT(`content_type: "text"`), 권한은 §7 RLS(`room_members` 참여 여부)가 최종 방어선이므로 서버 액션은 얇게 유지. **2026-08-03 개선**: 로그인 확인에 쓰던 `auth.getUser()`(Auth 서버 네트워크 왕복)를 `auth.getClaims()`(로컬 JWT 서명 검증)로 교체해 메시지 전송 지연 축소(ROADMAP.md Phase 3 "추가 개선" 참고) |
| `lib/realtime/messages.ts` | 신규 | `useRoomMessages(roomId, initialMessages)` 클라이언트 훅 — mount 시 `supabase.channel(\`room-${roomId}-messages\`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: \`room_id=eq.${roomId}\` }, ...).subscribe()`, unmount 시 `removeChannel`. RLS가 적용된 상태로 구독되므로 비참여자는 애초에 이벤트를 받지 못함(§ARCHITECTURE 7). Phase 4에서 참여자 실시간 변동까지 함께 관리하도록 재작성(§4.2). **2026-08-03 개선**: `sendMessage(content)`를 추가해 전송 즉시 임시 id로 낙관적 메시지를 붙이고, Realtime INSERT 이벤트가 오면 `sender_id`+`content`로 매칭해 실제 row로 치환(reconcile) — 내가 보낸 메시지도 Realtime 왕복을 기다리지 않고 바로 보이게 함(ROADMAP.md Phase 3 "추가 개선" 참고) |
| `app/(main)/rooms/page.tsx` | 변경 | 정적 컴포넌트 → async Server Component, `mockRooms` 대신 `getRoomList()`. **2026-08-03 추가**: `?tab=mine` 쿼리 기반 "전체 방"/"내가 참여중인 방" 탭 추가(로그인 사용자에게만 노출), 선택 시 `getMyRoomList()` 호출 |
| `app/(main)/rooms/new/page.tsx` | 변경 | async Server Component로 유지하되 `supabase.auth.getUser()`로 로그인 확인만 수행 — 비로그인이면 안내 문구 + 로그인 유도 버튼만 렌더링(미들웨어는 `/rooms`를 공개 경로로 유지하므로 로그인 차단은 화면 레벨에서 처리, §ARCHITECTURE 3), 로그인 상태면 폼 자체는 아래 `create-room-form.tsx`에 위임 |
| `components/rooms/create-room-form.tsx` | 신규 | 정적 마크업 폼 → Client Component, `react-hook-form` + `zod` + `createRoomAction` 연결(기존 `setup-profile-form.tsx` 패턴 재사용) |
| `app/(main)/rooms/[roomId]/page.tsx` | 변경 | async Server Component. `getRoomDetail` + `getMyRoomMembership` 조회 → 참여자가 아니면 `RoomJoinView`(입장하기 화면, 비밀번호 입력 포함)를, 참여자면 `RoomChatView`(+ 초기 메시지·참여자 목록)를 렌더링 |
| `components/rooms/room-join-view.tsx` | 신규 | 미참여 사용자용 "입장하기" 화면 — 방 제목/인원 표시, 비공개방이면 비밀번호 입력란, `joinRoomAction` 연결, 게스트는 로그인 유도 문구만 표시(방 목록·미리보기는 ROOM-01에 따라 게스트도 조회 가능) |
| `components/rooms/room-chat-view.tsx` | 변경 | `messages` prop(정적 배열) 대신 `useRoomMessages(roomId, initialMessages)` 사용. `ChatInputBar`에 `onSend` 콜백을 연결. **2026-08-03 개선**: `sendRoomMessageAction`을 직접 호출하던 것을 훅이 제공하는 `sendMessage()`(낙관적 UI 포함)로 교체 |
| `components/chat/chat-input-bar.tsx` | 변경 | 현재 마크업 전용 → `onSend: (text: string) => void` prop 추가, 전송 후 인풋 초기화. **2026-08-03 추가**: `disabled?: boolean` prop 추가 — 방 삭제 시(`roomDeleted`) 입력/전송 비활성화 |
| `components/rooms/participant-list.tsx` | 변경 | `MockParticipant` 타입을 실제 `room_members` + `profiles` 조인 결과 타입(`RoomMember`, `lib/queries/rooms.ts`에서 export)으로 교체 |
| `components/rooms/room-card.tsx` | 변경 | prop 타입을 `MockRoom` → `getRoomList()` 반환 타입으로 교체 (필드 자체는 이미 Phase 2에서 실사용 형태로 맞춰둠 — 아이콘/설명 필드 없음) |
| `lib/mock/rooms.ts` | 삭제 | 실데이터 연결 완료 후 제거 |
| `lib/mock/participants.ts` | 삭제 | 동일 |
| `lib/mock/messages.ts` | 부분 변경 | `mockRoomMessages`만 제거, `mockRandomMessages`는 Phase 5(랜덤채팅)까지 유지 필요하므로 파일 자체는 존속 |
| `middleware.ts` / `lib/supabase/middleware.ts` | 변경 없음 | `/rooms`는 이미 공개 경로로 처리되어 있음(방 목록·미리보기는 게스트도 접근) — 생성/입장/전송의 로그인 재검증은 서버 액션에서 수행 |

### 3.5 완료 조건 및 검증

- `npm run check-all` + `npm run build` 통과
- `mcp__supabase__get_advisors`로 신규 테이블 RLS 보안 점검 (RLS 미적용 테이블 없는지)
- 브라우저 두 개(또는 시크릿 창)로 같은 방에 입장해 텍스트 메시지 실시간 수신 확인
- 정원 초과 입장 차단, 비밀번호 오류 시 입장 거부, 게스트(익명 계정)의 방 생성 시도 차단을 각각 확인
- 강퇴/이미지 전송 관련 UI·로직은 이번 Phase 완료 조건에서 제외(§3.0)

**연관 PRD**: §5 ROOM-01~05, §5.1(이미지 제외), §5.2 방채팅 완료 조건(강퇴 제외 부분) — `ROADMAP.md` Phase 3과 동일

## Phase 4 — 방 나가기 / 온라인 상태 / 사용자 검색 (상세)

### 4.0 배경

방채팅 사용 중 "방을 나가기 누르지 않고 뒤로가기만 눌러도 여전히 참여 중인 상태인 게 기준이 애매하다"는 논의에서 출발했다. 결론:

- **멤버십**(`room_members` 행) — 영구, 명시적으로 "나가기"를 눌러야 해제됨. 메시지 기록 열람 권한·재입장 시 비밀번호 재입력 필요 여부의 기준.
- **온라인 상태**(Realtime Presence) — 일시적, 방 화면을 열어두고 있는 동안만 유지. 새로고침/네트워크 순단으로 멤버십에 영향 없음.

두 개념을 분리해서, 방 카드의 정원(`n/max`)은 계속 멤버십 기준으로 계산하고 온라인 여부는 별도 표시로만 노출한다.

### 4.1 DB 마이그레이션

| 파일 | 내용 |
|---|---|
| `20260802070000_create_leave_room_function.sql` | `leave_room(p_room_id uuid)` SECURITY DEFINER 함수. 방장이 나가면 `rooms` 행 삭제(→ `room_members`/`messages`가 on delete cascade로 함께 정리됨), 일반 참여자면 자신의 `room_members` 행만 삭제. `join_room()`과 동일하게 `authenticated`에게만 EXECUTE 부여 |
| `20260802100000_add_room_members_to_realtime_publication.sql` | `room_members`가 `supabase_realtime` publication에 등록된 적이 없어 postgres_changes 구독이 서버에 전혀 등록되지 않던 문제 수정. 참여자 입장/퇴장 실시간 반영(§4.2)의 진짜 원인이었음 |
| `20260802120000_restore_room_members_replica_identity_full_for_filter_matching.sql` | `room_members` REPLICA IDENTITY FULL. DELETE 이벤트의 old row에 `room_id`가 없으면 서버가 filter(`room_id=eq.X`) 매칭 자체를 못 해 이벤트가 라우팅되지 않는다 — 클라이언트로 오는 payload.old는 결국 기본키만 오지만, 서버 내부 필터 평가를 위해 FULL이 필요함 |
| `20260802130000_add_rooms_to_realtime_publication.sql` | (2026-08-03 추가) `rooms` 테이블이 `supabase_realtime` publication에 등록된 적이 없어 방 삭제(DELETE) 이벤트를 구독할 수 없던 문제 수정. REPLICA IDENTITY는 기본값(PK)으로 충분 — `id=eq.${roomId}` 필터 매칭에 PK만 있으면 됨 |

Realtime Presence는 DB 테이블이 아니라 각 클라이언트가 채널에 접속해있는 동안만 유지되는 인메모리 상태라 별도 마이그레이션이 필요 없다.

### 4.2 신규/변경 파일

| 파일 | 상태 | 설명 |
|---|---|---|
| `app/actions/rooms.ts` | 변경 | `leaveRoomAction(roomId)` 추가. 폼이 아닌 클릭 핸들러에서 직접 호출되므로 `redirect()`는 쓰지 않고 성공 여부(`ActionResult`)만 반환 — 클라이언트에서 `router.push("/rooms")` 처리 |
| `lib/realtime/presence.ts` | 신규 | `useRoomPresence(roomId, userId): Set<string>` — `room-${roomId}-presence` 채널을 구독해 `track()`으로 자신의 접속 상태를 알리고, `presence` `sync` 이벤트로 현재 온라인인 user id 집합을 반환 |
| `lib/realtime/messages.ts` | 재작성 | `useRoomMessages`가 메시지뿐 아니라 참여자 실시간 변동까지 함께 관리하도록 확장(`{ messages, participants }` 반환). **채널당 postgres_changes 바인딩 1개만 등록 가능**하다는 이 프로젝트 Realtime의 제약(§4.2 발견분) 때문에 메시지 채널과 참여자 변동 채널을 분리했고, 참여자 변동은 `event:"*"` 단일 바인딩으로 받아 매번 참여자 목록을 재조회해 이전 상태와 diff하는 방식으로 입장/퇴장을 판단(발신자 id로 payload.old를 신뢰할 수 없어서). 입장/퇴장 시 `isSystemNotice: true`인 `ChatMessage`(기존 타입에 이미 있던 필드)를 채팅 목록에 추가. **2026-08-03 추가**: `room-${roomId}-deleted` 전용 채널(DELETE, `id=eq.${roomId}` 필터)을 추가해 `roomDeleted` 상태 반환 — 방장이 나가 방이 삭제되면 감지. 이 상태일 땐 cascade로 함께 삭제되는 나머지 참여자들의 "OOO님이 나갔습니다" 시스템 메시지 생성을 생략 |
| `components/rooms/leave-room-dialog.tsx` | 신규 | 나가기 확인 다이얼로그. 방장이면 "방이 삭제되고 대화 내용이 사라진다"는 경고 문구로 분기 |
| `components/chat/chat-header.tsx` | 변경 | `onLeave`/`leaveLabel` prop 추가 — 전달되면 "더보기" 아이콘 버튼 대신 "나가기" 텍스트 버튼이 곧바로 노출됨(드롭다운에 숨기지 않음). 랜덤채팅 등 `onLeave`를 안 쓰는 화면은 기존과 동일하게 동작. **2026-08-03 수정**: `onOpenParticipants` 버튼에 `md:hidden` 추가 — PC(≥md)는 `ParticipantSidePanel`이 상시 노출되므로 헤더 버튼은 모바일 전용으로 숨김 |
| `components/rooms/participant-list.tsx` | 변경 | `onlineUserIds?: Set<string>` prop 추가 — 참여자 아바타에 온라인 초록 점 표시, PC 사이드패널 헤더에 "참여자 n명 · 온라인 m명" 표시. **2026-08-03 수정**: `ParticipantSidePanel`의 breakpoint를 `lg:block` → `md:block`으로 변경 — 기존엔 모바일 Dialog(`md:hidden`)와 PC 패널(`lg:block`) 기준이 어긋나 태블릿(768~1024px)에서 참여자 목록을 볼 방법이 없는 사각지대가 있었음, `docs/DEVELOPMENT_PLAN.md` §2.5의 `md` 기준과 통일 |
| `components/rooms/room-chat-view.tsx` | 변경 | `useRoomMessages`가 반환하는 실시간 `participants`를 참여자 패널/헤더 정원/방장 판별에 그대로 사용(서버가 내려준 정적 prop 대신). `useRoomPresence` 훅 연결, 나가기 다이얼로그 상태 관리 및 `leaveRoomAction` 호출 후 라우팅. **2026-08-03 추가**: `roomDeleted`가 true가 되면 배너+토스트 안내, `ChatInputBar`를 `disabled`로 전환, 1.8초 후 `/rooms`로 리다이렉트 |

### 4.3 완료 조건 및 검증 (완료)

- `npm run check-all`, `npm run build` 통과
- Playwright로 실제 방 생성 → 방장이 "나가기" → 방/멤버십/메시지가 DB에서 모두 삭제(cascade)됨을 SQL로 확인
- Playwright로 브라우저 탭 2개를 같은 방에 띄워 "참여자 n명 · 온라인 m명" 표시 확인 (같은 계정으로 테스트해 실질적으로는 Presence 파이프라인 동작만 검증 — 서로 다른 두 계정 간 온라인 카운트 정합성은 별도 검증 필요)
- 실제 두 번째 프로필(`kyu275`)을 DB에서 직접 입장/퇴장시켜, 새로고침 없이 "OOO님이 입장했습니다"/"나갔습니다" 시스템 메시지와 참여자 수·헤더 정원이 즉시 갱신됨을 확인
- 이 과정에서 Node 스크립트로 Realtime 인프라 제약 3건을 격리 재현·확인함(§ROADMAP Phase 4 "추가 검증" 참고): 채널당 바인딩 1개 제한, `room_members`의 publication 미등록, DELETE old row의 payload 축약

### 4.4 사용자 검색 (상세)

#### 4.4.0 범위와 전제

`is_anonymous`/`last_seen_at` 컬럼과 `pg_trgm` 검색 인덱스(`profiles_username_trgm_idx`)는 **Phase 3 착수 시점에 이미 마이그레이션 적용 완료**된 상태다(`supabase/migrations/20260726125413_add_chat_columns_to_profiles.sql`, `DB_SCHEMA.md` §1). `ROADMAP.md` Phase 4 체크리스트의 "DB: `last_seen_at` 컬럼 추가" 항목은 실제로는 완료 상태이며 체크 표기만 갱신하면 된다 — 이번 Phase에서 신규 마이그레이션은 필요 없다.

온라인 판단 방식은 `ARCHITECTURE.md` §5.2에서 이미 결정된 대로 하트비트(`last_seen_at`) + 조회 시점 임계값 비교(2분) 방식을 그대로 따른다(별도 Presence/배치 불필요).

| 제외 항목 | 이유 |
|---|---|
| 검색어 서버 영속(최근 검색 기록을 DB에 저장) | PRD SEARCH-01~03에 서버 저장 요구 없음. 브라우저 `localStorage` 전용으로 충분 |
| 다른 회원과의 DM/쪽지 | PRD §7.4, `ROADMAP.md` Phase 10(범위 외) |
| 온라인 사용자만 필터링하는 옵션 UI | PRD/ROADMAP 요구사항에 없음(정렬·필터는 닉네임 검색 결과 전체 노출로 충분) |

#### 4.4.1 신규/변경 파일

| 파일 | 상태 | 설명 |
|---|---|---|
| `app/actions/heartbeat.ts` | 신규 | `updateLastSeenAction()` — `auth.getClaims()`로 로그인 확인(비로그인이면 조용히 반환, 에러 아님) 후 `profiles.last_seen_at = now()` UPDATE. RLS는 기존 "본인 프로필 수정"(`auth.uid() = id`) 정책을 그대로 재사용하므로 별도 정책 불필요(`ARCHITECTURE.md` §5.2). `sendRoomMessageAction`과 동일하게 `getClaims()`를 써서 네트워크 왕복을 줄인다 |
| `lib/hooks/use-heartbeat.ts` | 신규 | 클라이언트 훅. mount 시 `updateLastSeenAction()` 즉시 1회 호출 + `document.visibilityState === "visible"`인 동안만 60초 간격으로 재호출. `visibilitychange` 리스너로 탭이 백그라운드로 가면 인터벌 정지, 다시 보이면 즉시 1회 갱신 후 재시작(불필요한 백그라운드 탭 갱신 방지) |
| `components/layout/heartbeat-provider.tsx` | 신규 | `"use client"`, UI 없는 로직 전용 wrapper. `userId: string \| null` prop을 받아 `null`이 아닐 때만 `use-heartbeat` 훅 호출 |
| `app/(main)/layout.tsx` | 변경 | 로그인 사용자(`supabase.auth.getUser()`)의 id를 `<HeartbeatProvider userId={...} />`에 전달해 전체 화면 공통으로 마운트 — 검색 화면에 있지 않아도 로그인 세션 동안 온라인 상태가 유지되어야 하므로 검색 페이지 단독이 아닌 공용 레이아웃에 배치 |
| `lib/queries/users.ts` | 신규 | `searchUsers(query, currentUserId)` — `profiles`에서 `is_anonymous = false`, 본인 제외(`neq("id", currentUserId)`), `username ilike '%query%'`(trgm 인덱스 활용) 조건으로 최대 30건 조회, `last_seen_at` 기준 `isOnline` 계산까지 포함해 반환. §4.4.2 참고 |
| `app/actions/users.ts` | 신규 | `searchUsersAction(query: string): Promise<SearchUserResult[]>` — `auth.getClaims()`로 로그인 확인(비로그인이면 빈 배열, SEARCH-01) → 검색어 trim 후 2자 미만이면 빈 배열 반환(과도한 broad-match 방지) → `searchUsers()` 위임 |
| `components/search/search-input.tsx` | 변경 | 정적 마크업 → Client Component. `value`/`onChange` controlled prop으로 변경(폼 제출 없이 입력 즉시 반영, 디바운스는 상위 패널에서 처리) |
| `components/search/user-search-panel.tsx` | 신규 | Client Component. 검색어 state 보유, 300ms 디바운스로 `searchUsersAction` 호출(기존 `checkUsernameAction` 디바운스 패턴과 동일 간격 재사용), 로딩/빈 검색어/결과없음 상태 분기 렌더링. `SearchInput` + `RecentSearchChips` + 결과 리스트(`UserSearchResultItem`)를 여기서 오케스트레이션 — 기존 `page.tsx`가 정적으로 조합하던 구조를 대체. 결과 클릭 시 `UserProfileDialog` 오픈 상태 관리, 검색 성공 시 `addRecentSearch()`로 최근 검색어 기록 |
| `app/(main)/search/page.tsx` | 변경 | 정적 페이지 → async Server Component. `supabase.auth.getUser()`로 현재 사용자 id만 조회해 `<UserSearchPanel currentUserId={user.id} />`에 전달(비로그인 리다이렉트 자체는 미들웨어가 `/search`를 이미 보호 경로로 처리하므로 페이지에서 재검증 불필요 — `lib/supabase/middleware.ts`의 `isPublicPath`에 `/search`가 없음) |
| `components/search/user-search-result-item.tsx` | 변경 | prop 타입을 `MockSearchUser` → `SearchUserResult`(`lib/queries/users.ts` export)로 교체, `onClick: () => void` prop 추가(클릭 시 프로필 다이얼로그 오픈) |
| `components/search/user-profile-dialog.tsx` | 신규 | 기존 shadcn `Dialog` 재사용. 검색 결과 클릭 시 아바타/닉네임/성별/나이/온라인 여부를 카드 형태로 표시 — 검색 결과에 이미 포함된 필드만 사용하므로 추가 쿼리 없이 즉시 표시(PRD §3.4.3 "검색 결과에서 프로필을 조회한다" 충족) |
| `lib/utils/recent-search.ts` | 신규 | 최근 검색어 `localStorage` 헬퍼 — `getRecentSearches()`, `addRecentSearch(term)`(중복 제거 + 최대 8개 유지), `clearRecentSearches()`. 서버 저장 없이 브라우저 로컬 전용(§4.4.0 근거) |
| `components/search/recent-search-chips.tsx` | 변경 | `items` prop은 유지하되 `onSelect(term: string)`/`onClearAll()` 콜백 prop 추가 — 클릭 시 해당 검색어로 재검색, "전체 삭제" 버튼이 실제로 `clearRecentSearches()`를 호출하도록 연결(Phase 2에서는 UI만 존재) |
| `lib/mock/users.ts` | 삭제 | 실데이터 연결 완료 후 제거 |

#### 4.4.2 검색 쿼리 상세

```ts
// lib/queries/users.ts
export interface SearchUserResult {
  id: string;
  nickname: string;
  age: number | null;
  gender: "male" | "female" | null;
  avatarUrl: string | null;
  isOnline: boolean;
}

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // ARCHITECTURE.md §5.2 — 2분 임계값

export async function searchUsers(
  query: string,
  currentUserId: string
): Promise<SearchUserResult[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, age, gender, avatar_url, last_seen_at")
    .eq("is_anonymous", false)
    .neq("id", currentUserId)
    .ilike("username", `%${query}%`)
    .limit(30);

  if (error || !data) return [];

  const now = Date.now();

  return data
    .filter((row) => row.username !== null)
    .map((row) => ({
      id: row.id,
      nickname: row.username!,
      age: row.age,
      gender: row.gender as "male" | "female" | null,
      avatarUrl: row.avatar_url,
      isOnline: now - new Date(row.last_seen_at).getTime() < ONLINE_THRESHOLD_MS,
    }));
}
```

- `ilike '%query%'`는 `profiles_username_trgm_idx`(gin, `gin_trgm_ops`) 덕분에 순차 스캔 없이 인덱스를 탄다.
- `is_anonymous = false` 조건으로 게스트 계정을 항상 제외(SEARCH-03). `profiles` select RLS가 `to authenticated using (true)`로 이미 열려 있어 별도 RLS 변경 불필요(`DB_SCHEMA.md` §2).
- 로그인 여부 재검증(SEARCH-01)은 `searchUsersAction`에서 `getClaims()`로 수행 — 쿼리 함수(`searchUsers`) 자체는 인증 여부를 모르는 얇은 데이터 계층으로 유지(`getRoomList`류 기존 패턴과 일관).

#### 4.4.3 완료 조건 및 검증 (완료, 2026-08-03)

- `npm run check-all`, `npm run build` 통과
- Playwright로 로그인 상태에서 "kyu"로 검색해 "kyu275" 결과가 표시되는지 확인 — 통과
- Supabase MCP SQL로 검색 페이지 로드 직후 `last_seen_at`이 실제 현재 시각으로 갱신되는지 확인(하트비트 mount 즉시 호출 검증) — 통과
- 테스트 계정의 `last_seen_at`을 SQL로 30초 전으로 직접 변경 후 재검색해 "오프라인" → "현재 온라인"으로 즉시 전환되는지 확인 — 통과
- 비로그인 상태(쿠키 없는 요청)로 `/search` 접근 시 미들웨어가 `/auth/login?redirect=/search`로 리다이렉트하는지 확인(SEARCH-01) — 통과
- 검색 결과 클릭 → 프로필 다이얼로그에 닉네임/성별/나이/온라인 여부가 올바르게 표시되는지 확인 — 통과
- "전체 삭제" 버튼 클릭 시 최근 검색어 영역이 사라지는지(localStorage 초기화) 확인 — 통과
- 익명(게스트) 계정 제외(SEARCH-03)는 쿼리 조건(`is_anonymous = false`)으로 코드 레벨에서 보장 — 실제 게스트 계정으로 별도 재현 테스트는 생략(게스트는 `username`이 없어 검색 대상 자체가 되기 어려움)

**연관 PRD**: §3.4 사용자 검색, §4.4 SEARCH-01~03 — `ROADMAP.md` Phase 4와 동일

## Phase 5 — 랜덤채팅 (텍스트) (상세)

> **⚠️ 이력 안내 (2026-08-05)**: 이 섹션은 최초 구현 시점의 설계 기록이다. 아래 §5.1(대기열
> 하트비트 20초 TTL), §5.3의 `match_or_wait()` TTL 삭제/2분 staleness 체크 로직은 **Phase 5.5에서
> Realtime Presence 기반으로 교체되었다** — 실제 최신 동작은 §5.5.6 "구현 결과 및 실제 검증"을
> 참고할 것. 이 섹션은 "어쩌다 지금 이런 모양이 됐는지"를 설명하는 이력으로만 남겨둔다. 또한 이
> 섹션 작성 이후 별도로 진행된 변경도 있다 — `profiles`/`guest_profiles` 분리(게스트 신원을 실가입
> 회원과 물리적으로 분리), 세션 종료 시 `random_session_archives`로 아카이브(현재는 종료 60초 후
> cron으로 지연 처리 — §5.5.6), 방채팅 게스트 입장 차단.

### 5.0 범위와 전제

`ROADMAP.md` Phase 5의 6개 항목(테이블+RLS, 게스트 임시 ID, 대기열 진입/취소, 매칭 트랜잭션, 1:1 메시지·종료·재매칭, 이탈 시 대기열 정리)을 다룬다. Phase 3~4에서 이미 검증된 실시간 메시지 파이프라인(낙관적 전송, `postgres_changes` 구독)을 그대로 재사용하고, 이번 Phase의 신규 작업은 사실상 **매칭 로직 + 익명 인증 부트스트랩**에 집중된다.

| 제외 항목 | 이유 / 실제 착수 시점 |
|---|---|
| 이미지 메시지 전송 (`content_type = 'image'`) | Phase 6. `messages` 테이블 자체는 이미 이미지 컬럼 구조까지 포함해 생성되어 있음(Phase 3) |
| 게스트 → 회원 전환 흐름 | `ARCHITECTURE.md` §2.2, PRD §1.3 제외 범위와 일치. MVP 범위 밖 |
| 매칭 상대 프로필 노출(닉네임/아바타 등) | PRD상 랜덤채팅은 "익명과의 대화"이며 신원 노출 요구사항 없음. 메시지 발신자 표시는 `me`/`상대방`으로만 구분(§5.5) |
| 메시지 전송 rate limit | Phase 7 |

### 5.1 설계 노트 — 게스트 식별자와 동시 매칭 경쟁 상태

`ARCHITECTURE.md` §2.2에서 이미 결정된 대로, 게스트 식별자는 별도 쿠키/토큰이 아니라 **Supabase Anonymous Sign-in**(`supabase.auth.signInAnonymously()`)으로 발급한다. 이 호출은 브라우저 쿠키에 세션을 기록해야 하므로 반드시 **클라이언트에서** 실행하고, 그 직후 이어지는 매칭 요청은 (Phase 3~4와 동일한 원칙에 따라) 서버 액션에서 처리한다 — 클라이언트가 익명 로그인 → 서버 액션(`enterRandomQueueAction`)이 새로 동기화된 쿠키로 `match_or_wait()`를 호출하는 순서.

**동시 매칭 경쟁 상태**: `match_or_wait()`는 `FOR UPDATE SKIP LOCKED`로 대기열을 조회해 두 사용자가 같은 상대를 동시에 선점하는 것은 막지만(RND-03), 대기열이 완전히 비어있는 상태에서 두 사용자가 정확히 동시에 "랜덤채팅 시작"을 눌러 각자 빈 대기열을 보고 **둘 다 자기 자신을 큐에 등록**하는 경우까지는 단일 함수 호출로 해소할 수 없다(서로의 INSERT가 서로에게 안 보임). 이 경우 두 사람 모두 "대기 중" 상태로 남아, 제3의 사용자가 나타나기 전까지는 서로 매칭되지 않는다.

이를 위해 대기 화면(§5.4)은 **Realtime 구독을 기본 경로로 삼고, 5초 간격 `match_or_wait()` 재호출을 폴백 폴링**으로 둔다 — 재호출은 멱등(이미 대기 중이면 그대로 유지, 이미 활성 세션이 있으면 그 세션 id를 반환)하도록 함수 자체에서 보장하므로 폴링이 부작용을 일으키지 않는다.

**최근 상대 재매칭 완화**: "방금 대화한 상대와 재매칭을 눌렀는데 곧바로 다시 매칭되는" 경험을 줄이기 위해, `match_or_wait()`의 대기열 후보 선택 시 최근 30분 이내에 나와 세션이 있었던 상대는 완전히 제외하지 않고 **정렬 순위만 뒤로 미룬다**(§5.3 쿼리의 `order by exists(...) asc, queued_at asc`). 다른 대기자가 있으면 그 사람이 먼저 선택되고, 대기열에 최근 상대밖에 없으면 그 사람과라도 매칭된다 — 완전 제외 방식은 대기자가 적은 시간대(새벽 등)에 매칭 자체가 무한정 지연될 위험이 있어 채택하지 않았다.

**대기열 하트비트 기반 TTL 정리 (2026-08-04 추가)**: 원래 계획은 "탭을 그냥 닫아 대기열이 정리되지 않는" 경우를 §5.6 완료 조건에서 "운영 단계 이슈로 분리"했지만, 실제 Playwright 검증 중 이 문제로 두 사용자가 서로 매칭되지 않고 유령 사용자와 매칭되는 현상이 재현되어(§ROADMAP.md Phase 5 "검증 중 발견한 이슈" 참고) 이번 Phase 안에서 해결하기로 변경한다.

클라이언트가 브라우저를 그냥 닫으면 JS가 실행될 기회 자체가 없어 서버에 이탈을 알릴 수 없다는 게 근본 제약이므로, 클라이언트 협조에 의존하지 않는 **서버 측 TTL(자동 만료)** 방식을 채택한다. 대기 화면은 이미 5초 간격으로 `match_or_wait()`를 폴백 폴링하고 있으므로(§5.1), 이 재호출 자체를 하트비트로 재활용한다:

- `random_queue`에 `queued_at`(최초 대기열 진입 시각, FIFO 정렬 기준— 절대 갱신하지 않음)과 별개로 `last_seen_at`(가장 최근 하트비트 시각) 컬럼을 추가한다. 두 컬럼을 분리하는 이유: 만약 `queued_at` 하나로 하트비트까지 겸하면 5초마다 값이 갱신되어 "먼저 대기한 사람이 먼저 매칭된다"는 FIFO 순서 자체가 무너진다.
- `match_or_wait()`가 "이미 대기열에 있으면 재등록하지 않고 반환"하는 멱등 분기(§5.3 원본 코드의 `if exists(...) then return null`)에서, 이제 `last_seen_at = now()`로 갱신한다 — 클라이언트 폴링이 곧 살아있다는 신호가 된다.
- `match_or_wait()` 시작 부분에서 `last_seen_at`이 임계값(20초 — 5초 폴링 간격의 4배, 네트워크 지연이나 백그라운드 탭 스로틀링에 대한 여유) 이전인 대기열 행을 죽은 것으로 간주해 삭제한다. 정상적으로 대기 중인 사용자는 폴링 덕에 항상 20초 이내로 갱신되므로 영향받지 않고, 탭을 닫은 사용자는 하트비트가 끊겨 다음 `match_or_wait()` 호출(다른 대기자가 들어올 때) 시점에 자동으로 청소된다.
- 이 방식은 완전한 실시간 정리는 아니고 최대 20초의 지연이 있을 수 있지만, "매칭 취소" 버튼이나 정상 매칭 흐름에는 영향이 없고 별도의 cron/배치 없이 기존 폴링 인프라만으로 해결된다는 장점이 있다.

### 5.2 DB 마이그레이션 (Supabase MCP `apply_migration`으로 순차 적용, 파일은 `supabase/migrations/`에 동기화)

| # | 파일명 | 내용 |
|---|---|---|
| 1 | `20260803140000_create_random_queue_and_sessions_tables.sql` | `random_queue`, `random_sessions` 테이블 + RLS(`DB_SCHEMA.md` §6 그대로) — `authenticated`(익명 세션 포함)에게 SELECT만 허용, INSERT/UPDATE/DELETE는 REVOKE(§5.3 함수로만 변경) |
| 2 | `20260803150000_add_session_support_to_messages.sql` | `messages.session_id`에 `random_sessions(id) on delete cascade` FK 추가(Phase 3 시점엔 `random_sessions`가 없어 FK 없이 생성해뒀던 컬럼 — `20260726125444_create_messages_table.sql`의 주석 참고), `DB_SCHEMA.md` §7의 세션 참여자 SELECT/INSERT 정책 2건 추가(세션 INSERT 정책은 `rs.status = 'active'` 조건 포함 — 종료된 세션에는 메시지를 못 보내게 막음, RND-05) |
| 3 | `20260803160000_create_random_matching_functions.sql` | `match_or_wait()`, `cancel_random_queue()`, `end_random_session(p_session_id uuid)` SECURITY DEFINER 함수(§5.3), `authenticated`에게만 EXECUTE 부여 |
| 4 | `20260803170000_add_random_tables_to_realtime_publication.sql` | `random_sessions`을 `supabase_realtime` publication에 등록(Phase 3~4에서 반복 발견된 "publication 미등록으로 구독 자체가 안 되는" 함정을 이번엔 착수 전에 반영 — `messages`는 Phase 3에서 이미 등록 완료되어 세션 메시지 구독에도 그대로 적용됨). `random_queue`는 클라이언트가 직접 구독하지 않으므로(§5.1 — 매칭 감지는 `random_sessions` INSERT로 처리) 등록 불필요 |
| 5 | `20260804000000_add_random_queue_heartbeat_and_stale_cleanup.sql` | (2026-08-04 추가) `random_queue`에 `last_seen_at timestamptz not null default now()` 컬럼 추가, `match_or_wait()`를 §5.1 "대기열 하트비트 기반 TTL 정리" 설계대로 재작성(`create or replace function`) — 하트비트 갱신 + 20초 이상 방치된 죽은 대기열 행 정리 |

마지막에 `mcp__supabase__generate_typescript_types`로 `lib/supabase/database.types.ts` 재생성.

### 5.3 `match_or_wait()` 등 SECURITY DEFINER 함수 상세

```sql
create or replace function public.match_or_wait()
returns uuid -- 매칭 성사 시 (신규 또는 기존) session id, 대기 상태 진입 시 null
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_partner uuid;
  v_session_id uuid;
  v_stale_before timestamptz := now() - interval '20 seconds';
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- 이미 활성 세션이 있으면 그대로 반환 (새로고침 등으로 재호출되어도 멱등, RND-02)
  select id into v_session_id
  from public.random_sessions
  where status = 'active' and (user_a_id = v_uid or user_b_id = v_uid)
  limit 1;
  if v_session_id is not null then
    return v_session_id;
  end if;

  -- 하트비트(last_seen_at)가 20초 넘게 갱신되지 않은 대기열 행은 브라우저 탭을 그냥 닫는 등으로
  -- 이탈한 것으로 간주해 정리한다(2026-08-04 추가, §5.1 "대기열 하트비트 기반 TTL 정리").
  -- 클라이언트는 5초 간격으로 이 함수를 재호출하므로 정상 대기자는 영향받지 않는다.
  delete from public.random_queue where last_seen_at < v_stale_before;

  -- 이미 대기열에 있으면 재등록 대신 하트비트만 갱신 (폴백 폴링 재호출 대비 멱등, §5.1)
  if exists (select 1 from public.random_queue where user_id = v_uid) then
    update public.random_queue set last_seen_at = now() where user_id = v_uid;
    return null;
  end if;

  -- 최근에 이미 대화했던 상대는 완전히 제외하지 않고 순위만 뒤로 미룬다(§5.1) —
  -- recently_matched가 true인 후보는 false인 후보보다 항상 뒤로 정렬되고,
  -- 그런 후보밖에 없으면 결국 그 상대와도 매칭된다(대기 무한정 지연 방지).
  select rq.user_id into v_partner
  from public.random_queue rq
  where rq.user_id <> v_uid
  order by
    exists (
      select 1 from public.random_sessions rs
      where rs.started_at > now() - interval '30 minutes'
        and ((rs.user_a_id = v_uid and rs.user_b_id = rq.user_id)
          or (rs.user_a_id = rq.user_id and rs.user_b_id = v_uid))
    ) asc,
    rq.queued_at asc
  for update skip locked
  limit 1;

  if v_partner is null then
    insert into public.random_queue (user_id) values (v_uid);
    return null;
  end if;

  delete from public.random_queue where user_id = v_partner;

  insert into public.random_sessions (user_a_id, user_b_id)
  values (v_partner, v_uid)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

create or replace function public.cancel_random_queue()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.random_queue where user_id = auth.uid();
end;
$$;

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
```

`end_random_session`은 `where status = 'active'`로 이미 종료된 세션에 대한 중복 호출을 조용히 무시한다(재매칭 시 "혹시 몰라 종료 호출" 패턴을 써도 안전).

### 5.4 신규/변경 파일

| 파일 | 상태 | 설명 |
|---|---|---|
| `lib/queries/random.ts` | 신규 | `getRandomSessionForUser(sessionId, userId)` — `random_sessions`에서 본인이 참여자인 세션만 조회(`status`, `endedBy` 포함), 비참여자·존재하지 않는 세션이면 `null`. `getRandomSessionMessages(sessionId)` — `getRoomMessages`와 동일 패턴으로 `messages`를 `session_id` 기준 조회해 `ChatMessage[]`로 변환(발신자 닉네임/아바타는 조회하지 않음 — §5.0 익명성 원칙) |
| `app/actions/random.ts` | 신규 | `enterRandomQueueAction()`: `getClaims()`로 인증 확인(비로그인·익명 세션 모두 통과) → `rpc("match_or_wait")` 호출 → `{ success, sessionId }` 반환(폼이 아닌 클릭/이펙트에서 직접 호출되므로 redirect 없이 값만 반환, `leaveRoomAction`과 동일 패턴). `cancelRandomQueueAction()`: `rpc("cancel_random_queue")` 호출 후 `ActionResult` 반환. `endRandomSessionAction(sessionId)`: `rpc("end_random_session", { p_session_id })` 호출 후 `ActionResult` 반환 |
| `app/actions/messages.ts` | 변경 | `sendRandomMessageAction(sessionId, content)` 추가 — `sendRoomMessageAction`과 동일하게 `getClaims()`로 로그인(익명 포함) 확인 후 `messages` INSERT(`session_id`, `content_type: "text"`), 세션 활성 여부·참여자 검증은 §5.2의 RLS가 최종 방어선 |
| `lib/realtime/random.ts` | 신규 | `useRandomSessionMessages(sessionId, initialMessages, currentUserId)` — `useRoomMessages`(`lib/realtime/messages.ts`)의 낙관적 전송·reconcile 로직을 세션 컨텍스트로 복제(참여자 목록 diff가 필요 없어 room 버전보다 단순하므로 공용 훅으로 추출하지 않고 별도 파일 유지). 채널 2개: `random-${sessionId}-messages`(INSERT, `session_id=eq.${sessionId}`)와 `random-${sessionId}-ended`(UPDATE, `id=eq.${sessionId}`, table `random_sessions`) — 후자가 `status: "ended"`이고 `ended_by !== currentUserId`면 `partnerEnded` 상태를 true로 설정해 상대방이 먼저 종료했음을 감지(§4.2에서 확인된 "채널당 바인딩 1개" 제약을 그대로 준수, 두 채널 모두 단일 바인딩) |
| `lib/hooks/use-random-matching.ts` | 신규 | 대기 화면 전용 클라이언트 훅. mount 시 (1) `supabase.auth.getSession()` 확인 후 없으면 `signInAnonymously()`, (2) `enterRandomQueueAction()` 호출, (3) `sessionId`가 오면 즉시 매칭 완료 상태 반환, (4) 아니면 `random_sessions` INSERT를 `user_a_id=eq.${uid}`/`user_b_id=eq.${uid}` 두 채널로 구독(§5.1 — 두 채널 모두 단일 바인딩) + 5초 간격 `enterRandomQueueAction()` 폴백 폴링. 매칭 완료 시 `sessionId`를 상태로 반환하고 폴링/구독을 정리. 언마운트 시(매칭 완료로 인한 언마운트가 아니면) `cancelRandomQueueAction()`을 베스트에포트로 호출해 대기열을 정리(RND-05) |
| `app/(main)/random/page.tsx` | 변경 | 정적 컴포넌트 → 클라이언트 컴포넌트(`RandomMatchingClient`)를 렌더링하는 얇은 래퍼로 변경. 서버에서 조회할 데이터가 없으므로 페이지 자체를 `"use client"`로 전환해도 무방 |
| `components/random/random-matching-client.tsx` | 신규 | `use-random-matching` 훅을 사용해 매칭 상태를 관리하는 클라이언트 컴포넌트. 기존 `MatchingIndicator`(경과 시간 타이머)를 그대로 사용하고, `sessionId`가 확보되면 `router.replace(`/random/${sessionId}`)`. "매칭 취소" 버튼 클릭 시 `cancelRandomQueueAction()` 호출 후 `router.push("/")` |
| `app/(main)/random/[sessionId]/page.tsx` | 변경 | 정적 → async Server Component. `getRandomSessionForUser(sessionId, user.id)`로 참여자 검증(비참여자/존재하지 않음이면 `notFound()`, 로그인 자체가 없으면 `/random`으로 redirect — 매칭 없이 URL 직접 접근 방지) → `getRandomSessionMessages(sessionId)`와 함께 `RandomChatView`에 전달 |
| `components/random/random-chat-view.tsx` | 신규 | `mockRandomMessages` 대신 `useRandomSessionMessages(sessionId, initialMessages, currentUserId)` 사용. `ChatHeader title="익명과의 대화" backHref="/" onLeave={...} leaveLabel="종료"` — `onLeave`는 `EndSessionDialog`를 염. 세션이 끝난 상태(본인 종료 또는 `partnerEnded`)가 되면 `ChatInputBar` 대신 "재매칭"/"홈으로" 두 버튼을 하단에 노출(재매칭은 `endRandomSessionAction` 호출 후 `/random`으로 이동해 새 매칭 사이클 시작, RND-05) |
| `components/random/end-session-dialog.tsx` | 신규 | `LeaveRoomDialog`(`components/rooms/leave-room-dialog.tsx`)와 동일한 shadcn `Dialog` 패턴으로 "대화를 종료하시겠어요?" 확인 다이얼로그(방 나가기와 달리 방장/일반 구분 없이 문구 단일) |
| `app/(main)/random/page.tsx`, `[sessionId]/page.tsx` | — | `middleware.ts`는 이미 `/random`을 공개 경로로 처리 중이라 변경 불필요(`ARCHITECTURE.md` §3) |
| `lib/mock/messages.ts` | 부분 변경 | `mockRandomMessages` 제거(방채팅 쪽 `mockRoomMessages`는 Phase 3에서 이미 제거됨 — 이 Phase를 끝으로 해당 파일 전체 삭제 대상) |

### 5.5 메시지 발신자 표시 원칙

랜덤채팅은 신원을 드러내지 않는 것이 설계 의도이므로(§5.0), `ChatMessage.senderName`은 실제 닉네임이 아니라 `"나"` / `"상대방"` 고정 문자열을 사용하고 `senderAvatarUrl`은 채우지 않는다(아바타는 `ChatMessageBubble`의 기본 이니셜로 대체). `variant`(`"me" | "other"`) 판별은 기존과 동일하게 `senderId === currentUserId`로 수행한다.

### 5.6 완료 조건 및 검증

- `npm run check-all`, `npm run build` 통과
- `mcp__supabase__get_advisors`로 신규 테이블(`random_queue`, `random_sessions`) RLS 보안 점검
- Playwright 브라우저 두 개(시크릿 창)로 각각 로그인 없이 "랜덤채팅 시작" 클릭 → 두 세션이 매칭되어 같은 `sessionId`로 이동하고 실시간 텍스트 대화가 오가는지 확인
- 매칭 대기 중 "매칭 취소" 클릭 시 `random_queue`에서 본인 행이 삭제되는지 SQL로 확인
- 한쪽이 "종료" 클릭 시 상대방 화면에 종료 안내가 실시간으로 뜨고 입력창이 비활성화되는지 확인
- "재매칭" 클릭 시 새 대기열 진입 → 세 번째 브라우저(또는 재진입한 상대)와 다시 매칭되는지 확인
- 브라우저 탭을 그냥 닫아 대기열에서 이탈했을 때(언마운트 정리 로직 미동작 케이스) 대기열에 좀비 행이 남는지 확인하고, 남는다면 TTL 정리 전략을 별도 이슈로 기록(§ARCHITECTURE 4에서 언급된 "TTL성 정리"는 이번 Phase 완료 조건에 포함하지 않음 — cron 기반 정리는 운영 단계 이슈로 분리)

**연관 PRD**: §4.2 RND-01~03, RND-05 — `ROADMAP.md` Phase 5와 동일

---

## Phase 5.5 — 랜덤채팅 Presence 기반 재설계 (상세)

### 5.5.0 배경 — 왜 다시 손대는가

Phase 5를 실사용 검증하며 "유령 상대와 매칭됨", "브라우저를 그냥 닫으면 대기열이 안 정리됨" 같은 문제가
반복적으로 나왔고, 그때마다 시간 기반 임계값(TTL/하트비트/폴링)을 하나씩 추가하며 땜질했다. 지금
누적된 시간 기반 로직은 다음 4가지다.

| 메커니즘 | 임계값 | 문제 |
|---|---|---|
| `random_queue` 하트비트 TTL | 20초 | "5초마다 폴링하니 20초면 죽은 걸로 본다"는 추측. 폴링 주기를 바꾸면 임계값도 같이 바꿔야 함 |
| `match_or_wait()` 활성 세션 staleness 체크 | 2분 | 상대가 탭을 백그라운드로 보내면(하트비트 정지) 실제로는 살아있어도 오탐 가능 |
| 대기 화면 5초 폴백 폴링 | 5초 간격 | 매칭 여부를 계속 서버에 물어보는 방식 — 응답 지연이 곧 매칭 지연 |
| 하트비트(`useHeartbeat`, 60초) | 60초 | 원래 "온라인 상태 표시"용인데 게스트 정리·세션 staleness 판단까지 겸하게 되며 책임이 섞임 |

이 모든 문제의 본질은 같다 — **HTTP 요청/응답 기반 폴링만으로는 "지금 이 사람이 실제로 연결되어 있는가"를
정확히 알 방법이 없고, 그래서 항상 "얼마나 기다려야 죽은 걸로 볼지"를 추측해야 한다.** 이 프로젝트는
이미 Phase 4에서 방채팅 참여자 온라인 표시에 **Supabase Realtime Presence**를 써본 전례가 있다(`ROADMAP.md`
Phase 4) — Presence는 WebSocket 연결 자체를 상태로 쓰므로, 연결이 끊기면 수 초 내로 다른 클라이언트에게
`leave` 이벤트가 실시간으로 전달된다. 랜덤채팅의 "유령 감지" 문제에도 같은 메커니즘을 적용한다.

### 5.5.1 설계 원칙

- **정합성(누구와 매칭할지)은 여전히 DB 트랜잭션이 담당한다.** Presence는 클라이언트가 관찰하는 상태일
  뿐 RLS나 원자성을 보장하지 않으므로, `FOR UPDATE SKIP LOCKED` 기반 매칭 로직(§5.3)은 그대로 둔다.
  이번 재설계가 바꾸는 것은 오직 **"이 사람이 지금 진짜로 연결되어 있는가"를 판단하는 방법**이다.
- **시간 기반 로직을 완전히 없애지는 않는다.** 서버 크래시, Presence 이벤트 유실처럼 정말 예외적인
  경우를 위한 안전망은 필요하다. 다만 이걸 매칭/종료 감지의 **주 경로(hot path)**에서 **드물게 도는
  안전망(cold path)**으로 강등한다 — 정상 흐름에서는 절대 발동되지 않아야 하고, 임계값도 훨씬
  느슨하게(수 시간~하루 단위) 잡아 "혹시 몰라 청소하는" 수준으로만 남긴다.
- **온라인 상태 표시(사용자 검색, Phase 4)와 게스트 자동 정리(7일 TTL)는 건드리지 않는다.** 이 둘은
  애초에 "초 단위 정확도"가 필요 없는 용도라 시간 기반이 적합하다. 이번에 손대는 건 랜덤채팅의
  대기열/세션 유령 감지뿐이다.

### 5.5.2 바뀌는 것 — 컴포넌트별

**A. 대기열 유령 정리** (기존: 20초 TTL 삭제)
`/random` 진입 시 클라이언트가 `random-waiting-room` Presence 채널에 `track({ user_id })`으로 join한다.
`match_or_wait()`가 매칭 후보를 고르기 직전, DB 큐 자체가 아니라 **그 시점의 presence roster에 실제로
있는 사용자만** 후보로 취급하도록 클라이언트가 후보 uid를 함께 넘기거나, 매칭 시도 전에 presence
roster와 대조해 이미 나간 사용자의 큐 행을 지운다. TTL처럼 "20초를 기다렸다가" 지우는 게 아니라
매칭을 시도하는 바로 그 순간의 실제 연결 상태로 판단하므로 지연이 없다.

**B. 활성 세션 유령 감지** (기존: `match_or_wait()`의 2분 staleness 체크, 오늘 추가했다가 이번에 되돌림)
매칭된 두 사용자가 `random-session-${sessionId}` Presence 채널에 join한다. 상대가 disconnect되면
(탭 종료, 네트워크 끊김) 수 초 내로 `leave` 이벤트가 발생 — 이를 감지한 클라이언트가 즉시
"상대방이 나갔습니다" UI로 전환하고 `endRandomSessionAction()`을 호출해 세션을 종료(아카이브)한다.
기존 `postgres_changes` UPDATE 구독(`random-${id}-ended` 채널)은 "상대가 명시적으로 종료 버튼을
눌렀을 때"만 담당하도록 역할을 좁히고, "말없이 사라짐" 감지는 Presence가 전담한다.

**C. 대기 화면 폴링** (기존: 5초 고정 간격)
Presence의 `sync`/`join` 이벤트를 트리거로 삼아 "대기실에 새 사람이 들어오는 순간" 매칭을 재시도하도록
바꾼다 — 5초를 기다리지 않고 이벤트 즉시 반응한다. 다만 Presence 이벤트 유실 가능성에 대비해 훨씬
느슨한 폴백 폴링(예: 30초)은 유지한다.

**D. 세이프티넷 (신규, cold path)**
- `random_sessions`: 24시간 넘게 `active` 상태인 세션을 강제 종료하는 pg_cron 배치 1개 추가(기존
  `end_random_session()`의 아카이브 로직 재사용).
- `random_queue`: TTL을 20초 대신 훨씬 느슨한 값(예: 10분)으로 완화해 "Presence가 실패했을 때만
  겨우 발동하는" 수준으로 낮춘다.
- `cleanup_stale_anonymous_users()`(게스트 7일 정리)의 "활성 세션 있으면 정리 안 함" 조건은 위
  세이프티넷 덕분에 활성 세션이 24시간 이상 방치되는 일이 없어지므로 그대로 안전하게 유지 가능.

### 5.5.3 검증이 필요한 전제

- **Presence가 이 Supabase 환경에서 안정적으로 동작하는가** — Phase 4에서 방채팅 온라인 표시에 이미
  써봤지만, 이 프로젝트는 `postgres_changes` 바인딩 관련 환경 특이 버그를 여러 번 발견한 이력이
  있으므로(§ARCHITECTURE, Phase 3~4 기록) Presence도 소규모로 먼저 스파이크 검증한다. Presence는
  `postgres_changes`와 다른 서브시스템(Phoenix 채널 네이티브 기능)이라 그 버그가 적용되지 않을
  가능성이 높지만, 확인 없이 전제하지 않는다.
- Presence `leave` 이벤트가 실제로 몇 초 내에 도착하는지(네트워크 환경에 따른 지연 범위) 실측.
- 브라우저 탭을 완전히 강제 종료(`browser.close()` 등)했을 때도 서버가 소켓 종료를 감지해 `leave`를
  정상적으로 발생시키는지(정상 종료가 아닌 강제 종료 케이스가 실제 유령 상대 시나리오와 가장 가까움).

### 5.5.4 실행 순서

1. Presence 스파이크 검증 — 대기실 채널 join/leave가 실제로 몇 초 내 반영되는지 Playwright로 소규모 확인
2. `match_or_wait()`에서 20초 TTL 삭제 로직 제거, presence 기반 후보 필터링으로 교체
3. `match_or_wait()`의 2분 staleness 체크 제거, 세션 Presence 채널 기반 즉시 감지로 교체
   (`lib/realtime/random.ts`, `lib/hooks/use-random-matching.ts` 리팩토링)
4. 세이프티넷 pg_cron 배치 2건 추가(24시간 세션 강제 종료, 대기열 TTL 완화)
5. Playwright로 "상대 탭 강제 종료" 시나리오 재현 테스트 — 유령 상대 없이 즉시 감지되는지 확인
6. `ROADMAP.md`/`DEVELOPMENT_PLAN.md` Phase 5 섹션의 안내 문단을 "대체될 예정"에서 "대체됨"으로
   갱신하고 실제 구현 결과를 §5.5.6에 기록 (완료 — 아래 참고)

### 5.5.5 완료 조건

- 정상 매칭/대화/종료 흐름이 기존과 동일하게 동작(회귀 없음)
- 대기 중이던 사용자가 브라우저를 강제 종료하면, 다른 대기자가 매칭을 시도하는 즉시(수 초 내) 그
  자리가 정리되고 유령과 매칭되지 않음
- 대화 중이던 상대가 브라우저를 강제 종료하면, 남은 사용자가 수 초 내에 "상대방이 나갔습니다"를 보게 됨
- 세이프티넷 배치가 정상 흐름에서는 발동하지 않음(24시간/10분 임계값 안에서 종료되는 세션이 배치 대상에
  잡히지 않는지 SQL로 확인)

**연관**: `ROADMAP.md` Phase 5.5, Phase 5 §5.1/§5.3(대체 대상)

### 5.5.6 구현 결과 및 실제 검증 (2026-08-05)

계획(§5.5.1~5.5.5) 그대로 구현했고, 구현/검증 과정에서 계획에 없던 문제 2건을 추가로 발견해 함께
고쳤다. 상세 재현/원인/수정 내역은 `ROADMAP.md` Phase 5.5 "검증 완료"/"검증 중 발견한 버그 2건"
참고. 요약:

- `match_or_wait(p_live_user_ids uuid[])`: `p_live_user_ids`가 주어지면 그 목록에 없는 대기열
  후보는 애초에 고르지 않는다(계획대로). 추가로 **"이미 대기열에 있어도 매 호출마다 파트너 탐색을
  다시 시도"**하도록 바꿨다 — 원래 설계에도 있던 "동시 매칭 경쟁 상태"가 폴백 폴링만으로는 자기
  자신을 못 벗어난다는 잠재 결함을 이번에 발견해 함께 고쳤다.
- 세션 종료 감지: `random-session-${sessionId}` Presence 채널의 `leave` 이벤트로 상대 이탈을
  즉시(실측 571ms) 감지하고 `endRandomSessionAction()`을 호출한다(계획대로). 다만
  `end_random_session()`은 더 이상 그 자리에서 아카이브+삭제까지 하지 않는다 — 상태만
  `'ended'`로 바꾸고, 아카이브+삭제는 `archive_ended_random_sessions()`가 "종료된 지 60초 지난"
  세션만 별도 cron(1분 간격)으로 뒤늦게 처리한다. 즉시 삭제하면 아직 화면이 열려있는 상대방에게
  `postgres_changes` UPDATE 이벤트 자체가 전달되지 않는 문제가 있었기 때문(원인 추정: Realtime이
  RLS 재검증 시점에 행이 이미 삭제되어 있으면 이벤트를 드롭하는 것으로 보임 — WebSocket 프레임
  레벨까지 캡처해 서버는 이벤트를 정상 전송하지만 클라이언트 콜백이 호출되지 않음을 확인).
- 세이프티넷: `cleanup_stale_random_queue()`(10분 TTL, 5분 간격), `end_abandoned_random_sessions()`
  (양쪽 다 24시간 무응답, 하루 1회), `archive_ended_random_sessions()`(종료 60초 후, 1분 간격) —
  총 3개의 저빈도 pg_cron 배치로 분리했다(계획 시점엔 2개만 예상했으나 위 종료-알림 버그를 고치며
  1개 추가됨).
- 매칭 성사 직후 대기실 채널(`removeChannel()`)이 완전히 정리되기 전에 세션 화면으로 넘어가면,
  같은 Realtime 연결 위에서 새 세션 채널 구독이 조용히 씹히는 경우가 있어 `removeChannel()` 완료를
  기다린 뒤 화면을 전환하도록 `lib/hooks/use-random-matching.ts`를 수정했다.

**마이그레이션**: `random_chat_presence_based_ghost_detection`(원 계획),
`match_or_wait_retry_while_queued`, `defer_random_session_archive_for_realtime_delivery`(추가
발견 수정 2건) — 로컬 파일은 `supabase/migrations/20260805010000_*`, `20260805020000_*`,
`20260805030000_*`.

**후속 수정 (2026-08-05, 게스트 TTL 단축 + 재매칭 후순위 로직 복구)**: 위 60초 지연 아카이브
수정의 부작용으로 "최근 30분 이내 만난 상대 후순위 미루기"(§5.1)가 종료 1분 뒤부터는 조회 대상
자체가 없어 사실상 무력화되어 있던 것을 발견했다. `match_or_wait()`의 최근 매칭 조회를
`random_sessions`뿐 아니라 `random_session_archives`도 함께 보도록 수정. 겸사겸사 게스트 계정
TTL도 7일(하루 1회 정리)에서 1일(6시간마다 정리)로 단축했다 — 같은 브라우저 재방문은 세션이
재사용되어 하트비트가 계속 갱신되므로 영향 없고, 정말 안 돌아오는 계정만 더 빨리 정리된다.
마이그레이션: `shorten_guest_ttl_and_fix_recent_match_dedup`
(`supabase/migrations/20260805040000_*`).

**후속 수정 (2026-08-05, 대기실 Presence 제거 — 최종 단순화)**: 실사용자 두 명으로 라이브 테스트한
결과 대기실 Presence 동기화 자체가 실제 네트워크 환경에서 신뢰할 수 없다는 것과(같은 채널에 30초
넘게 있어도 서로 안 보이는 경우 재현), "매칭을 성사시킨 쪽"과 "선택된 쪽"의 알림 방식이 비대칭이라
후자가 실시간 알림을 놓치면 폴백 폴링 주기만큼 그대로 대기한다는 것을 확인했다. 두 문제를 한 번에
해소하기 위해:
- `match_or_wait()`에서 `p_live_user_ids` 파라미터(Presence 기반 필터)를 완전히 제거하고, 후보
  판단을 DB 하트비트 신선도(15초 — 대기 화면 5초 폴링의 3배 여유) 하나로 단순화
- 대기실 Presence 채널(`random-waiting-room`)을 `lib/hooks/use-random-matching.ts`에서 완전히
  제거 — §5.5.2 A에서 설계했던 "presence roster 기반 필터링"은 폐기
- 폴백 폴링 간격을 30초 → 5초로 되돌려 "선택된 쪽"의 최악의 대기 시간을 단축

세션 Presence(`lib/realtime/random.ts`, 상대 이탈 즉시 감지)는 라이브 테스트에서도 안정적으로
동작했고 대체할 하트비트 기반 방법이 마땅치 않아 그대로 유지한다. 결과적으로 대기실 쪽은 "DB 큐 +
하트비트 + 짧은 폴링 + postgres_changes 빠른 경로"로, 세션 쪽은 "postgres_changes(명시적 종료) +
Presence(말없는 이탈)"로 정리되어, 애초에 §5.5.0에서 걱정했던 "메커니즘이 너무 많아 조잡해지는"
문제도 함께 줄었다(대기실 쪽 Presence 관련 코드 전체 삭제). 마이그레이션:
`match_or_wait_heartbeat_fallback_for_presence`, `remove_waiting_room_presence_use_heartbeat_only`
(`supabase/migrations/20260805050000_*`, `20260805060000_*`).

Playwright 재검증(프로덕션 빌드): 매칭 2.78초, 메시지 실시간 0.52초, 강제 탭 종료 감지(세션
Presence) 3.14초 — 전부 정상.

**후속 수정 (2026-08-06, 세션 Presence 단독 신뢰의 한계 확인 + 세션 전용 하트비트 도입)**: 위
§5.5.6에서 "세션 Presence는 라이브 테스트에서도 안정적으로 동작했다"고 판단했으나, 실사용자
테스트에서 상대가 브라우저를 정상 종료했는데도 `leave` 이벤트가 오지 않아 남은 쪽 화면에 죽은
세션이 계속 남는 경우가 재현됐다. `get_logs`(realtime 서비스)로 원인을 확인한 결과, 브라우저
종료 방식(정상/비정상)과 무관하게 **Realtime 테넌트 자체가 접속자가 뜸하면 통째로 잠들었다 새
연결에 깨어나는 주기**가 있고, 이 재초기화 구간에 걸리면 서버가 leave diff 자체를 브로드캐스트
하지 못해 클라이언트가 이미 캐시해둔 presence 상태를 다시 읽는 방식(재확인 폴링)으로는 못 잡는다는
것을 확인했다.

1차 시도로 검색 화면 온라인 표시용 하트비트(`profiles/guest_profiles.last_seen_at`, 90초
임계값)를 재사용해 안전망을 만들었으나, 이 하트비트가 탭이 백그라운드로 가면 갱신을 멈추는
것(검색 화면 용도에는 맞지만) 때문에 채팅 중 잠깐 다른 탭을 보기만 해도 세션이 오탐 종료되는 새
버그가 생겨 즉시 되돌렸다. 최종적으로 검색용 하트비트와 완전히 분리된 **세션 전용 하트비트**를
도입했다:

- `random_sessions`에 `last_seen_a_at`/`last_seen_b_at` 컬럼 추가
- `heartbeat_random_session(p_session_id)` — 세션 화면이 열려있는 동안(탭 가시성과 무관하게) 10초
  간격으로 호출해 본인 컬럼을 갱신하고, 같은 응답으로 상대 컬럼과 `status`/`ended_by`를 받는다
- 클라이언트가 상대 하트비트를 25초(폴링 간격의 2.5배) 이상 못 받으면 직접
  `endRandomSessionAction()`을 호출 — Presence `leave`는 "되면 빠른"(보통 수 초) 경로로 남기고,
  이 하트비트가 최악의 경우에도 약 35초 안에는 잡아주는 진짜 신뢰 소스가 된다
- `match_or_wait()`의 재접속 시 활성 세션 반환과 `end_abandoned_random_sessions()`(1분 간격 cron)
  는 같은 컬럼을 보되, 클라이언트 폴링이 대부분 처리하므로 90초의 훨씬 느슨한 최후 안전망으로만
  남긴다. 더 이상 쓰이지 않게 된 `user_last_seen_at()` 헬퍼는 삭제.

마이그레이션: `heartbeat_backstop_for_stale_active_sessions`(되돌린 1차 시도, 90초 임계값 도입),
`session_scoped_heartbeat_for_active_leave_detection`, `heartbeat_random_session_return_ended_by`
(`supabase/migrations/20260806000000_*`, `20260806010000_*`, `20260806020000_*`).

### 5.5.7 후속 UI 수정 (2026-08-07~08) — Phase 5 마무리

랜덤채팅/방채팅 공통 화면에서 실사용 중 드러난 문제 3건 + 종료 UX 정리. 상세 배경은
`ROADMAP.md` Phase 5.5 "추가 개선 (2026-08-07~08)" 참고. 요약:

| 항목 | 내용 | 파일 |
|---|---|---|
| 방채팅 메시지 미로딩 | `messages.sender_id` FK가 Phase 5에서 `auth.users`로 바뀐 뒤 `profiles!messages_sender_id_fkey` embed가 무효가 되어 초기 메시지 조회가 조용히 실패 → 메시지/프로필 각각 조회 후 JS에서 병합 | `lib/queries/rooms.ts` |
| 자동 스크롤 미동작 | 바깥 래퍼 `min-h-screen`(상한 없음) 탓에 `flex-1 overflow-y-auto`가 높이를 못 받아 내부 스크롤 자체가 없었음 → `h-screen overflow-hidden` + 목록에 `min-h-0`. 스크롤 이동도 sentinel `scrollIntoView` → 컨테이너 `scrollTop = scrollHeight` 직접 지정으로 교체(하단 padding까지 반영) | `components/random/random-chat-view.tsx`, `components/rooms/room-chat-view.tsx` |
| 종료 UX | 재확인 다이얼로그 제거(즉시 종료), 종료 배너 강조 + 대화 목록 하단 시스템 알림 버블 추가, 하단 버튼을 "재매칭" 단독으로 정리 | 동 위, `components/random/end-session-dialog.tsx`(삭제) |
| 로그아웃 노출 | 프로필 화면 내부 → 좌측 사이드바 상시 노출 | `components/layout/sidebar-nav.tsx` |

DB 변경 없음(마이그레이션 없음). Playwright로 실제 DOM을 측정해 스크롤 동작 검증
(`scrollTop 505.14` vs `maxScroll 505`).

## Phase 6 — 이미지 전송 (상세)

`ROADMAP.md` Phase 6 / PRD §4.2 RND-04, §5 ROOM-05, §5.1 이미지 정책, §7.1 이미지 검증 대응.

### 6.0 착수 시점 현황 (2026-08-08 확인)

먼저 실제로 뭐가 없는지부터 확인했다. **이미 준비되어 있는 것**:

| 항목 | 상태 |
|---|---|
| `messages.content_type` `'image'` 값 | 스키마·CHECK 제약·생성된 타입에 이미 포함 |
| `content`에 Storage 경로 저장한다는 규약 | `DB_SCHEMA.md` §7 주석에 명시됨 |
| 조회 → `imageUrl` 매핑 | `lib/queries/rooms.ts`, `lib/queries/random.ts` 양쪽에 이미 구현됨 |
| Realtime 수신 → `imageUrl` 매핑 | `lib/realtime/messages.ts`, `lib/realtime/random.ts` 양쪽에 이미 구현됨 |
| 이미지 버블 렌더링 | `ChatMessageBubble`이 `imageUrl` 있으면 `next/image`로 렌더 |
| Supabase 호스트 이미지 허용 | `next.config.ts` `remotePatterns`에 이미 등록됨 |

**즉 비어 있는 것은 4가지뿐이다**: ① 버킷과 Storage 정책, ② 업로드 경로(액션 + UI), ③ 저장된 "경로"를 표시 가능한 "URL"로 바꾸는 변환, ④ 삭제된 방/세션의 이미지 정리. 기존 매핑 코드가 `imageUrl: message.content`로 **경로를 그대로 URL 자리에 넣고 있어** ③을 넣을 때 이 지점을 반드시 고쳐야 한다(현재 상태로는 깨진 이미지가 뜬다).

Storage 버킷은 **현재 0개**다(`avatars`도 실제로는 없음 — `profiles.avatar_url`은 외부 URL만 쓰고 있었다). 이 프로젝트의 첫 Storage 작업이므로 참고할 기존 정책이 없다.

`ChatInputBar`의 `+` 버튼은 `disabled`로 자리만 잡혀 있다(`components/chat/chat-input-bar.tsx:30`).

### 6.1 설계 결정

#### (1) 경로 규칙 — 기존 문서 수정 필요

`ARCHITECTURE.md` §8은 `chat-images/{room_id 또는 session_id}/{uuid}.{ext}`로 적고 있으나, 이대로면 **Storage RLS에서 첫 세그먼트만 보고 `rooms`를 조회해야 할지 `random_sessions`를 조회해야 할지 판별할 수 없다**(uuid라 형태로도 구분 불가). 컨텍스트 접두사를 붙인다.

```
chat-images/rooms/{room_id}/{uuid}.{ext}
chat-images/sessions/{session_id}/{uuid}.{ext}
```

→ `ARCHITECTURE.md` §8, `DB_SCHEMA.md` §7 주석·§9를 이 규칙으로 갱신한다.

#### (2) 업로드 방식 — 서명 업로드 URL (클라이언트 직접 업로드)

`ARCHITECTURE.md` §8의 "서버 액션에서 검증 후 Storage에 업로드"를 문자 그대로 구현하면 5MB 파일이 서버 액션 body로 흐르는데, **Next.js 서버 액션 body 기본 상한이 1MB**라 그대로는 동작하지 않는다. 상한을 6MB로 올릴 수는 있지만 5MB가 Vercel 함수를 그대로 통과하게 되어 대역폭·실행시간 낭비다. `DB_SCHEMA.md` §9가 이미 적어둔 **"서버 액션에서 서명 URL 발급 후 수행"** 방식을 채택한다.

```
1. 클라: 파일 선택 → 형식/용량 사전 검사(UX용) → 미리보기
2. 클라 → 서버 액션 createChatImageUploadUrlAction(context, id, ext)
     서버: 로그인 확인(getClaims) + 참여자 여부 재검증 + UUID 경로 생성
           → createSignedUploadUrl(path) 발급 (파일 자체는 서버를 거치지 않음)
3. 클라: 서명 URL로 Storage에 직접 업로드
4. 클라 → 서버 액션 sendRoomImageMessageAction / sendRandomImageMessageAction(path)
     서버: 경로가 본인이 방금 발급받은 형식인지 + 오브젝트가 실제 존재하는지 +
           size/mimetype 재확인 → messages INSERT (content_type='image', content=path)
```

메시지 row가 화면 표시의 유일한 근거이므로, 4단계 검증에 실패하면 INSERT하지 않고 업로드된 오브젝트를 삭제한다 → **검증을 통과하지 못한 파일은 어떤 화면에도 나타나지 않는다.**

#### (3) 검증은 3중 — 단, 매직바이트 검사는 하지 않음

| 계층 | 내용 | 우회 가능성 |
|---|---|---|
| 클라이언트 사전 검사 | 확장자·`file.size`·`file.type` | 우회 가능 (UX 목적) |
| **버킷 레벨** | `file_size_limit = 5MB`, `allowed_mime_types = image/jpeg,image/png,image/webp` | **Storage 서버가 강제 — 우회 불가** |
| 메시지 INSERT 액션 | 업로드된 오브젝트의 실제 `metadata->>'size'` / `mimetype` 재확인 | 우회 불가 |

한계 명시: `allowed_mime_types`는 **선언된** Content-Type 기준이라, 실제로는 이미지가 아닌 파일에 `image/png` 헤더를 붙이면 통과한다. 파일 내용(매직바이트) 검사는 파일이 서버를 거치지 않는 이 방식에서는 불가능하다. 완화 요인: 버킷이 비공개라 참여자만 접근 가능하고, 경로가 UUID이며, 표시는 `next/image`를 통해서만 이뤄진다. 실행 위험은 없고 "이미지가 안 보인다" 수준의 문제라 MVP에서는 수용한다. (**Phase 7.5 신고 처리**로 사후 대응)

#### (4) 조회 — 비공개 버킷 + 서명 URL

`ARCHITECTURE.md` §10에서 이미 "퍼블릭 버킷(접근 제어 불가)"을 기각했으므로 그대로 간다. 서명 URL 발급 주체는 두 경로로 나뉜다.

- **초기 로드**(`getRoomMessages` / `getRandomMessages`): 이미지 메시지 경로를 모아 `createSignedUrls()`로 **한 번에 배치 발급** (메시지 50개마다 개별 발급하지 않는다)
- **Realtime 수신**: 새 이미지 메시지가 도착한 시점에 클라이언트가 `createSignedUrl()` 단건 발급. Storage SELECT RLS가 참여자 여부를 검증하므로 클라이언트가 직접 발급해도 안전하다

TTL은 **1시간**. 장시간 열어둔 탭에서 만료될 수 있으므로 `<Image onError>`에서 1회 재발급하는 폴백을 둔다.

#### (5) 이미지 정리 — 어느 문서에도 없던 구멍

DB cascade는 Storage 파일을 지우지 않는다. 현재 설계대로면 **방장이 나가 방이 삭제되거나(§Phase 4) 랜덤 세션이 종료·아카이브될 때마다(§Phase 5) 이미지가 전부 고아 파일로 영구히 남는다.**

보존 기준은 기존 아카이브 정책(30일)에 맞춘다 — 신고 대응 시 대화 내용만 있고 이미지가 없으면 반쪽이기 때문이다.

| 시점 | 이미지 처리 |
|---|---|
| 방/세션이 살아있는 동안 | 유지 (참여자 조회 가능) |
| 방 삭제·세션 종료 직후 | 파일은 유지하되, 참조하던 `rooms`/`random_sessions` row가 사라져 **Storage RLS가 자동으로 접근을 차단** → 참여자도 더는 못 봄 (대화 내용이 URL 재방문 시 404가 되는 기존 동작과 일관) |
| 아카이브 30일 만료 | 대화 아카이브 정리와 **같은 배치에서 이미지도 삭제** |

정리 주체: `storage.objects` row만 지우면 실제 파일이 스토리지 백엔드에 남으므로 **pg_cron만으로는 안 된다.** Route Handler `app/api/cron/cleanup-chat-images/route.ts`(`CRON_SECRET` 검증 + 서비스 롤 키)를 만들고, 고아 경로 목록은 SECURITY DEFINER 함수 `list_orphaned_chat_images()`로 SQL에서 뽑아 `storage.remove()`로 삭제한다. 실제 스케줄 등록은 Vercel Cron이므로 **Phase 9(배포)에 의존** — Phase 6에서는 엔드포인트와 수동 호출 검증까지만 하고, Phase 9 체크리스트에 cron 등록 항목을 추가한다.

### 6.2 태스크 — 파일 단위

#### DB / Storage (마이그레이션)

| # | 내용 |
|---|---|
| M1 | `chat-images` 비공개 버킷 생성 (`file_size_limit` 5MB, `allowed_mime_types` 3종) |
| M2 | Storage RLS — SELECT: 경로 1번째 세그먼트가 `rooms`면 `is_room_member()`로, `sessions`면 `random_sessions` 참여자 여부로 검증 |
| M3 | Storage RLS — INSERT: 위와 동일 조건 + 업로드 시점에 방/세션이 살아있을 것. UPDATE/DELETE 정책은 만들지 않음(수정·삭제 불가) |
| M4 | `list_orphaned_chat_images()` SECURITY DEFINER — `messages`·두 아카이브 테이블 어디에서도 참조되지 않는 경로 반환 |

> ⚠️ Phase 3에서 겪은 RLS 무한 재귀를 되풀이하지 않도록, 정책 안에서 `room_members`를 직접 서브쿼리하지 말고 기존 `is_room_member()` SECURITY DEFINER 함수를 재사용한다.

#### 서버 액션 / 쿼리

| 파일 | 작업 |
|---|---|
| `app/actions/chat-images.ts` (신규) | `createChatImageUploadUrlAction()` — 참여자 재검증 + UUID 경로 + 서명 업로드 URL 발급 |
| `app/actions/messages.ts` | `sendRoomImageMessageAction()`, `sendRandomImageMessageAction()` 추가 — 오브젝트 실존·size·mimetype 재확인 후 INSERT, 실패 시 오브젝트 삭제 |
| `lib/storage/chat-images.ts` (신규) | 경로 생성/파싱, 확장자·MIME 화이트리스트, 서명 URL 배치 발급 헬퍼 (서버·클라 공용 상수) |
| `lib/queries/rooms.ts` | `getRoomMessages()` — `imageUrl: message.content` → 서명 URL 배치 발급 결과로 교체 |
| `lib/queries/random.ts` | `getRandomMessages()` — 동일 |

#### 클라이언트

| 파일 | 작업 |
|---|---|
| `components/chat/chat-input-bar.tsx` | `+` 버튼 활성화 → 파일 선택(`accept="image/jpeg,image/png,image/webp"`), 사전 검증, `onSendImage` prop 추가. 업로드 중 진행 상태 표시 |
| `components/chat/chat-image-preview.tsx` (신규) | 전송 전 미리보기 + 취소 |
| `lib/realtime/messages.ts` | `sendImageMessage()` 추가 — 텍스트와 동일한 낙관적 UI(로컬 `URL.createObjectURL`로 즉시 표시 → Realtime INSERT 도착 시 실제 row로 치환). 경로가 UUID라 `content` 기준 reconcile 매칭은 그대로 성립 |
| `lib/realtime/random.ts` | 동일 |
| `components/rooms/room-chat-view.tsx` | `handleSendImage` 연결 |
| `components/random/random-chat-view.tsx` | 동일 |
| `components/chat/chat-message-bubble.tsx` | 로딩·만료 폴백(`onError` 재발급), 클릭 시 원본 확대(경량 Dialog) |

#### 배치

| 파일 | 작업 |
|---|---|
| `app/api/cron/cleanup-chat-images/route.ts` (신규) | `CRON_SECRET` 검증 → `list_orphaned_chat_images()` → `storage.remove()` |

#### 문서

- `ARCHITECTURE.md` §8 — 경로 규칙에 `rooms/`·`sessions/` 접두사 반영, 업로드 방식을 서명 업로드 URL로 정정
- `DB_SCHEMA.md` §7 주석·§9 — 동일 반영 + 이미지 보존/정리 정책 추가
- `npm run db:types` 재생성

### 6.3 검증 시나리오 (Playwright + SQL)

1. 방채팅에서 JPG/PNG/WEBP 각 1장 전송 → 상대 브라우저에 실시간 표시
2. 랜덤채팅(게스트 두 명, 익명 로그인)에서 동일 확인 — **게스트 업로드가 Storage RLS를 통과하는지가 핵심**
3. 5MB 초과 파일 → 클라 단계에서 거부. 클라 검사를 우회해 직접 업로드 시도 → 버킷 레벨에서 거부되는지 SQL/직접 호출로 확인
4. 비참여자가 이미지 경로를 알고 서명 URL 발급 시도 → Storage RLS로 거부
5. 방장이 방을 나가 방 삭제 → 잔류 참여자가 이미지에 더는 접근 못 함, 파일은 아직 남아있음(아카이브 대응용) SQL로 확인
6. `list_orphaned_chat_images()` 호출 → 살아있는 방/세션의 이미지가 목록에 섞이지 않는지 확인(**정상 이미지를 지우는 사고 방지**가 가장 중요)
7. 정리 엔드포인트 수동 호출 → 고아 파일만 삭제됨 확인
8. `get_advisors(security)`로 신규 Storage 정책 점검

### 6.4 구현 결과 (2026-08-08)

계획대로 구현·검증 완료. 상세 검증 내역은 `ROADMAP.md` Phase 6 "검증 완료" 참고. 계획 대비 달라진 점은 없다.

**검증 중 발견·수정한 버그 1건 (계획에 없던 것)**: `/api/cron/cleanup-chat-images`가 **미들웨어에 가로채여 `/auth/login`으로 307 리다이렉트**되고 있었다. 세션 쿠키가 없는 Cron 요청은 라우트의 `CRON_SECRET` 검증에 도달조차 못 하므로, 배포 후 정리 배치가 조용히 실행되지 않았을 문제다. `lib/supabase/middleware.ts`의 공개 경로에 `/api/cron`을 추가해 해결.

> 교훈: 세션이 아닌 다른 수단(시크릿 헤더)으로 스스로를 보호하는 엔드포인트를 추가할 때는 **미들웨어의 인증 리다이렉트가 그 앞을 막지 않는지** 반드시 확인해야 한다. 앞으로 `/api/*` 계열 배치·웹훅 엔드포인트를 추가할 때 동일하게 점검할 것.

### 6.5 Phase 7 이월 / 열린 이슈

- **이미지 업로드 rate limit** — 게스트도 업로드 가능하므로 스팸·불법 이미지의 주요 경로가 된다. Phase 7의 rate limit 대상에 메시지 전송·방 생성과 함께 **이미지 업로드**를 명시적으로 포함시킨다
- **Vercel Cron 등록** — Phase 9 배포 체크리스트에 `cleanup-chat-images` 스케줄 추가. 배포 시 `SUPABASE_SERVICE_ROLE_KEY`/`CRON_SECRET`을 Vercel 환경변수에도 등록해야 한다(로컬 `.env.local`에는 2026-08-08 설정 완료)
- **매직바이트 검사 미적용** — 위 §6.1(3) 한계. 필요 시 Phase 7.5 신고 처리로 대응
- **`next/image` 최적화 캐시** — 서명 URL이 1시간마다 바뀌면 최적화 결과가 재사용되지 않는다. 실측 후 필요하면 채팅 이미지에 한해 `unoptimized` 검토

## Phase 7 — 권한 검증 및 계정 관리 (상세)

`ROADMAP.md` Phase 7 / PRD §4.1 AUTH-02, §5 ROOM-06·ROOM-07, §7.1 전체 대응.

### 7.0 착수 시점 현황 (2026-08-08 확인)

먼저 이미 있는 것과 없는 것을 구분했다.

| 항목 | 상태 |
|---|---|
| `kick_member(p_room_id, p_target_user_id)` SECURITY DEFINER 함수 | Phase 3 DB 설계 때부터 이미 존재(§DB_SCHEMA 8). 방장 재검증 + `room_members` DELETE + `room_bans` INSERT까지 구현됨 |
| 강퇴 이력 재입장 차단 | `join_room()`이 이미 `room_bans` 확인 후 `banned_from_room` 예외를 던짐(§`20260804145603` 마이그레이션) — **완료됨** |
| 비참여자 메시지 접근 차단 | `messages` SELECT RLS가 이미 참여자만 허용(§Phase 3, Phase 6에서 입장 시점 컷오프까지 강화) — **완료됨, 재검증만 필요** |
| 강퇴 UI/서버 액션 | **없음** — `kick_member` RPC를 호출하는 곳이 코드 전체에 0곳(`grep` 확인) |
| 계정 탈퇴 서버 액션 | **없음** — `app/(main)/profile/page.tsx`에 "계정 탈퇴" 문구만 있고 동작 없음 |
| rate limit | **없음** — 관련 라이브러리도 미설치, DB 카운터 테이블도 없음 |
| `rooms.owner_id`/`random_sessions.*_id` cascade가 아카이브를 우회하는 문제 | `ROADMAP.md` Phase 6 검증 중 발견, **미해결** — 이번 Phase의 핵심 항목 |

즉 이번 Phase는 ①강퇴 UI 연결, ②계정 탈퇴 구현, ③탈퇴/강제삭제가 아카이브를 우회하는 구조적 결함 수정, ④rate limit 신규 구현, ⑤기존 RLS 재검증 다섯 갈래다. ①③④가 실제 작업량 대부분이고 ②⑤는 상대적으로 가볍다.

### 7.1 설계 결정

#### (1) 아카이브 우회 문제 — 트리거 방식으로 통합 (가장 먼저 처리)

**왜 먼저인가**: 계정 탈퇴(이번 Phase)와 Phase 7.5의 관리자 강제 삭제가 둘 다 이 경로를 타므로, 탈퇴 기능을 구현하기 전에 고쳐야 탈퇴 기능 자체가 처음부터 안전하게 나온다. 순서를 바꿔 탈퇴부터 만들면 "탈퇴하면 신고 증거가 사라지는" 상태로 한 번 배포되는 셈이라 위험하다.

**현재 구조의 문제**: `leave_room()`과 `end_random_session()`은 각각 자기 함수 안에서 "아카이브 INSERT → 원본 DELETE"를 수동으로 수행한다. 이 두 함수를 거치지 않고 `rooms`/`random_sessions` 행이 지워지는 경로(계정 탈퇴의 cascade, 향후 관리자 강제 삭제)는 아카이브 INSERT를 건너뛰고 바로 DELETE만 일어난다.

**해결**: `rooms`, `random_sessions` 두 테이블에 각각 `BEFORE DELETE` 트리거를 달아 "삭제되기 직전 행을 무조건 아카이브에 남긴다"를 테이블 레벨에서 보장한다. 그리고 `leave_room()`/`end_random_session()`에서 수동 아카이브 INSERT 로직을 제거해 `DELETE`만 남긴다 — 이렇게 해야 트리거가 유일한 아카이브 경로가 되어 이중 기록(함수가 한 번, 트리거가 또 한 번)을 피한다.

```sql
-- rooms: 트리거가 archive_room()의 INSERT 본문을 그대로 흡수
create or replace function public.archive_room_before_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.room_archives
    (original_room_id, title, owner_id, max_members, is_private, member_ids, created_at, messages)
  select
    old.id, old.title, old.owner_id, old.max_members, old.is_private,
    coalesce((select array_agg(rm.user_id) from public.room_members rm where rm.room_id = old.id), '{}'),
    old.created_at,
    coalesce((select jsonb_agg(jsonb_build_object(
      'sender_id', m.sender_id, 'content', m.content,
      'content_type', m.content_type, 'created_at', m.created_at
    ) order by m.created_at) from public.messages m where m.room_id = old.id), '[]'::jsonb);
  return old;
end;
$$;

create trigger archive_room_before_delete
  before delete on public.rooms
  for each row execute function public.archive_room_before_delete();
```

`random_sessions`도 동일한 패턴이되, **실제 아카이브 주체를 정정**한다: `end_random_session()`은 이미 `status='ended'`로 UPDATE만 하고 끝나고(§`20260805030000` — Realtime UPDATE 전달을 위해 삭제를 의도적으로 지연시킴), 실제 삭제는 1분 간격 cron `archive_ended_random_sessions()`이 "종료된 지 60초 지난" 세션에 대해 수행한다. 이 함수가 지금 하는 수동 아카이브 INSERT를 제거하고 `delete from public.random_sessions where id = v_session.id`만 남긴다 — 트리거가 그 DELETE를 가로채 아카이브를 대신 남긴다. `ended_at`/`ended_by`는 이미 `end_random_session()`의 UPDATE로 채워져 있으므로 트리거가 보는 `old` 행에는 정상적으로 값이 들어있다. 계정 탈퇴로 인한 cascade처럼 `status='active'`인 채로(즉 `ended_at`이 아직 null인 채로) 삭제되는 경우에는 트리거가 `coalesce(old.ended_at, now())`/`coalesce(old.ended_by, null)`로 직접 채운다.

이 변경 하나로 "탈퇴", "관리자 강제 삭제(Phase 7.5)", 향후 생길 수 있는 다른 삭제 경로 전부가 자동으로 안전해진다 — Phase 7.5 착수 시 별도 처리 불필요.

> ⚠️ 트리거 함수도 `security definer` + `set search_path = ''`로 작성해 기존 컨벤션(§Phase 3 RLS 재귀 회피, §Phase 6 정리 배치)을 따른다. `room_archives`/`random_session_archives`는 `revoke all`이라 트리거가 아니면 어차피 아무도 못 쓴다.

#### (2) 방장 강퇴 — 기존 함수 재사용, UI만 신규

DB 쪽은 이미 완성되어 있으므로 서버 액션 한 겹 + UI만 추가한다.

```
클라(참여자 목록, 방장에게만 강퇴 버튼 노출)
  → kickMemberAction(roomId, targetUserId)
      서버: kick_member() RPC 호출 (방장 재검증은 함수 내부가 이미 수행 — 액션은 그대로 위임)
      실패 시(RPC가 방장 아니면 raise) 에러를 ActionResult로 변환
  → 성공 시 참여자 목록 로컬 갱신
```

강퇴당한 사용자에게 알리는 방법은 Phase 4에서 이미 구현된 "방 삭제 시 남은 참여자에게 실시간 안내" 패턴(Realtime + 클라이언트 리다이렉트)을 그대로 재사용한다 — `room_members` DELETE 이벤트를 강퇴 대상이 구독 중이면 그걸 신호로 방채팅 화면에서 강제 퇴장시키고 안내 토스트를 띄운다. 새 브로드캐스트 채널을 만들 필요는 없다.

#### (3) 계정 탈퇴 — Admin API + 확인 절차

```
클라(프로필 페이지, "계정 탈퇴" 버튼)
  → 확인 다이얼로그(되돌릴 수 없음 명시, 텍스트 입력 확인 등 오탈 방지 고려)
  → deleteAccountAction()
      서버: getClaims()로 로그인 상태 재검증(본인 확인은 세션 자체가 곧 본인이므로 별도 파라미터 불필요)
            supabase.auth.admin.deleteUser(uid) 호출 (서비스 롤 키 사용 — Phase 6에서 이미
            .env.local에 SUPABASE_SERVICE_ROLE_KEY 설정 완료, 새 서버 전용 admin 클라이언트
            팩토리를 lib/supabase/admin.ts에 추가해 cron 라우트와 공유)
            → auth.users 삭제 → profiles cascade
            → rooms(owner였던 것)/random_sessions/room_members/random_queue 전부 cascade
            → (1)의 트리거가 rooms/random_sessions 삭제마다 자동으로 아카이브 남김
  → 성공 시 클라에서 signOut 처리 후 홈으로 리다이렉트
```

탈퇴 후 재로그인 불가는 `auth.users` 자체가 삭제되므로 별도 구현 없이 자연히 보장된다(PRD 수용 기준과 일치).

#### (4) rate limit — DB 카운터 방식

외부 서비스(Upstash 등) 신규 연동 없이 Postgres만으로 처리한다. MVP 트래픽 규모에서 Redis급 성능이 필요하지 않고, 이미 모든 쓰기가 SECURITY DEFINER 함수/서버 액션을 거치므로 카운터 체크를 끼워 넣기 쉽다.

```sql
create table public.rate_limit_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('send_message', 'create_room', 'upload_image')),
  created_at timestamptz not null default now()
);

create index rate_limit_events_user_action_idx
  on public.rate_limit_events (user_id, action, created_at desc);

-- 클라이언트는 이 테이블에 직접 쓰지 않는다 — 아래 함수를 통해서만 기록/확인
revoke all on public.rate_limit_events from authenticated, anon;

create or replace function public.check_and_record_rate_limit(
  p_action text, p_max_count integer, p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  select count(*) into v_count
  from public.rate_limit_events
  where user_id = auth.uid()
    and action = p_action
    and created_at > now() - make_interval(secs => p_window_seconds);

  if v_count >= p_max_count then
    return false;
  end if;

  insert into public.rate_limit_events (user_id, action) values (auth.uid(), p_action);
  return true;
end;
$$;
```

호출 지점: `sendRoomMessageAction`/`sendRandomMessageAction`(메시지), `createRoomAction`(방 생성), `createChatImageUploadUrlAction`(이미지 업로드 — Phase 6 이월 항목). 각 액션이 실제 쓰기 전에 `check_and_record_rate_limit()`을 호출해 `false`면 `RATE_LIMITED` 에러를 반환한다.

구체적 한도(횟수/시간창)는 PRD에 수치가 없어 임의 결정이 필요하다 — **착수 시 아래 기본값으로 시작하고 필요시 조정**:

| 액션 | 한도 |
|---|---|
| 메시지 전송 | 10초당 10회 |
| 방 생성 | 1일 5회 |
| 이미지 업로드 | 1분당 10회 |

오래된 행 정리는 `room_archives`/`random_session_archives`와 동일하게 pg_cron 일 배치(`cleanup_old_rate_limit_events`, 예: 7일 이상 지난 행 삭제)로 처리한다.

#### (5) 비참여 사용자 메시지 접근 차단 — 재검증만

DB 정책은 이미 완성되어 있으므로(§7.0), 신규 구현 없이 검증 시나리오(§7.3)로 회귀 확인만 한다.

### 7.2 태스크 — 파일 단위

#### DB (마이그레이션)

| # | 내용 |
|---|---|
| M1 | `archive_room_before_delete()` 트리거 함수 + `rooms` BEFORE DELETE 트리거, `leave_room()`에서 수동 아카이브 INSERT 제거 |
| M2 | `archive_random_session_before_delete()` 트리거 함수 + `random_sessions` BEFORE DELETE 트리거, `archive_ended_random_sessions()`(cron, `end_random_session()` 아님)에서 수동 아카이브 INSERT 제거 |
| M3 | `rate_limit_events` 테이블 + `check_and_record_rate_limit()` 함수 + `cleanup_old_rate_limit_events()` + pg_cron 등록 |

#### 서버 액션

| 파일 | 작업 |
|---|---|
| `lib/supabase/admin.ts` (신규) | 서비스 롤 키로 admin 클라이언트 생성하는 공용 팩토리(`app/api/cron/cleanup-chat-images/route.ts`의 인라인 생성 로직을 여기로 옮겨 재사용) |
| `app/actions/rooms.ts` | `kickMemberAction(roomId, targetUserId)` 추가, `createRoomAction`에 rate limit 체크 삽입 |
| `app/actions/profile.ts` (또는 `app/actions/account.ts` 신규) | `deleteAccountAction()` — `getClaims()` 재검증 + `admin.deleteUser()` |
| `app/actions/messages.ts` | `sendRoomMessageAction`/`sendRandomMessageAction`에 rate limit 체크 삽입 |
| `app/actions/chat-images.ts` | `createChatImageUploadUrlAction`에 rate limit 체크 삽입 (Phase 6 이월 항목) |

#### 클라이언트

| 파일 | 작업 |
|---|---|
| 방채팅 참여자 목록 컴포넌트 | 방장에게만 강퇴 버튼 노출 + 확인 다이얼로그 |
| `lib/realtime/messages.ts` | 강퇴당한 본인이 `room_members` DELETE 이벤트를 받으면 강제 퇴장 처리(기존 "방 삭제 안내" 리다이렉트 로직과 통합) |
| `app/(main)/profile/page.tsx` | "계정 탈퇴" 버튼에 확인 다이얼로그 + `deleteAccountAction` 연결 + 성공 시 signOut/리다이렉트 |
| 메시지 전송/방 생성/이미지 업로드 UI | rate limit 초과 에러를 토스트로 표시 |

#### 문서

- `DB_SCHEMA.md` §5(room_bans 옆에 트리거 언급)·§8(SECURITY DEFINER 함수 표에 트리거 함수·rate limit 함수 추가), `rate_limit_events` 섹션 신규
- `ARCHITECTURE.md`에 rate limit 설계 개요 추가
- `npm run db:types` 재생성

### 7.3 검증 시나리오

1. **강퇴**: 방장이 참여자 강퇴 → 대상자 화면에서 즉시 강제 퇴장 + 안내. 일반 참여자가 `kick_member` RPC를 직접 호출(SQL/devtools) → 방장 아니므로 거부되는지 확인
2. **재입장 차단**: 강퇴된 사용자가 같은 방에 다시 `join_room` 시도 → `banned_from_room` 거부
3. **트리거 아카이브(핵심)**: 테스트 계정으로 방을 만들고 메시지를 보낸 뒤, `leave_room()`을 거치지 않고 **`delete from auth.users`로 직접 탈퇴 경로를 재현** → `room_archives`에 해당 방 기록이 남는지 SQL로 확인 (Phase 6 검증 때 이게 비어 있어서 문제를 발견했던 바로 그 시나리오 — 이번엔 남아야 통과)
4. **탈퇴**: `deleteAccountAction()` 실행 후 동일 자격증명으로 재로그인 시도 → 실패 확인. 탈퇴 사용자가 방장이던 방의 남은 참여자에게 "방이 삭제되었습니다" 안내가 정상 도달하는지(기존 Phase 4 로직이 cascade delete에도 반응하는지) 확인
5. **rate limit**: 메시지 전송을 한도 초과로 연타 → 초과분 거부 및 에러 응답 확인, 정상 사용자 흐름(한도 내)은 영향 없음 확인
6. **비참여자 차단 재검증**: 방 미참여 계정으로 `messages` 직접 SELECT → 0건. 랜덤채팅 세션 비참여자도 동일
7. `get_advisors(security)`로 신규 함수/테이블 점검

### 7.4 구현 결과 (2026-08-09)

계획대로 구현·검증 완료. 상세 검증 내역은 `ROADMAP.md` Phase 7 "구현 완료"/"검증 중 발견한 버그" 참고. 실제 검증은 Playwright MCP가 이 세션에서 사용 불가능해 전부 **SQL 직접 재현**(역할 전환 `set local role authenticated` + `request.jwt.claims`로 RLS·SECURITY DEFINER 함수를 실사용자 권한으로 호출)으로 수행했다. 계획과 달라진 점 2가지:

1. **§7.1 (2) 방장 강퇴 "DB 쪽은 이미 완성되어 있다"는 전제가 틀렸다.** `kick_member()`가 `DB_SCHEMA.md`에는 Phase 3부터 문서화되어 있었지만 실제로는 어느 마이그레이션에도 없었다(`pg_proc` 조회 0건). 계획에 없던 함수 신규 구현이 추가됐다(`20260809000000_create_kick_member_function.sql`). 문서만 보고 "이미 있다"고 판단하지 말고 실제 DB를 조회로 확인해야 한다는 교훈 — Phase 6에서도 비슷하게 "문서와 실제가 다를 수 있다"는 걸 겪었지만(경로 규칙 등), 이번엔 아예 존재 여부 자체가 틀려 있었다.
2. **§7.1 (1) 트리거 설계를 SQL로 직접 재현하다가 계획에 없던 FK 문제를 발견해 §7.1에 없던 마이그레이션이 추가됐다.** `messages.sender_id`/`room_bans.banned_by`가 `ON DELETE NO ACTION`이라 계정 탈퇴 자체가 FK 위반으로 실패했다(트리거가 도는지 여부와 무관하게 탈퇴가 안 됨). 사용자에게 CASCADE/SET NULL/시스템 placeholder 중 선택지를 제시해 **SET NULL**로 결정, `20260808050000_nullable_sender_and_banned_by_for_account_deletion.sql`로 처리하고 `lib/queries/rooms.ts`·`random.ts`에 "탈퇴한 사용자" 표시 로직을 추가했다. 계획 문서(§7.1 (3))에는 이 FK 문제가 전혀 언급되어 있지 않았다 — SQL로 실제 삭제를 재현해보지 않았다면 코드 리뷰만으로는 못 잡았을 문제.

강퇴 실시간 알림도 계획에 없던 재설계가 있었다: 원래 "room_members DELETE Realtime 이벤트가 강퇴당한 본인에게도 그대로 전달된다"고 가정했으나, RLS가 postgres_changes 이벤트를 현재 테이블 상태 기준으로 재검증하는 특성상 본인 멤버십이 이미 사라진 뒤라 전달이 안 될 가능성이 컸다(Phase 4에서 "방 삭제 안내"를 `rooms` DELETE 채널로 별도 처리했던 것과 같은 종류의 함정). 강퇴 시 새로 생기는 `room_bans` 행을 구독하는 방식으로 바꾸고, 본인 조회 RLS 정책과 `room_bans`의 realtime publication 등록(기존에 빠져 있었음)을 추가했다.

### 7.5 Phase 7.5로 이월

- `check_and_record_rate_limit()`/`rate_limit_events`는 Phase 7.5 관리자 화면에서 "이상 활동 사용자" 조회에 재사용 가능 — 설계 시 참고
- 강제 삭제(Phase 7.5)는 트리거 덕분에 별도 아카이브 처리 없이 안전 — `ROADMAP.md` Phase 7.5 경고 문구는 해제 완료
- rate limit 기본값(메시지 10초당 10회, 방 생성 1일 5회, 이미지 업로드 1분당 10회)은 실사용 데이터 없이 정한 임의값이다. 실제 운영 데이터가 쌓이면 Phase 7.5 대시보드에서 재조정 검토

## Phase 7.5 — 관리자 페이지 (사이트 운영) (상세)

### 7.5.0 범위와 전제

`ROADMAP.md` Phase 7.5의 4개 그룹(접근 제어, 대화 내용 조회, 사용자 관리, 운영 기능)을 다룬다. `rooms`/`random_sessions` BEFORE DELETE 트리거(§Phase 7)가 이미 삭제 경로 전부에 아카이브를 보장하므로, 이번 Phase는 **별도 아카이브 안전장치 없이** 조회·조치 UI만 구현하면 된다.

| 제외 항목 | 이유 / 실제 착수 시점 |
|---|---|
| 콘텐츠 자동 검수(이미지 매직바이트 검사 등) | `ROADMAP.md` Phase 10, 범위 외. 신고 큐는 사람이 직접 열람해 판단하는 방식으로 충분 |
| 계정 정지 기간 만료 자동 해제 배치 | 최초 구현은 수동 해제만 지원(관리자가 다시 활성화). 자동 만료는 실사용 데이터를 보고 이후 결정 |
| 관리자 초대/역할 관리 UI | `profiles.role='admin'`은 이번 Phase에서 Supabase MCP로 직접 SQL UPDATE해 1인 운영자를 지정. 여러 관리자·권한 등급 구분은 범위 밖 |
| 신고 사유 카테고리 커스터마이징 | 고정된 enum(스팸/욕설·혐오/불법콘텐츠/기타)으로 시작 |

### 7.5.1 접근 제어 설계

- **판별 컬럼**: `profiles.role`는 이미 존재하며(`role text not null default 'user'`, 체크 제약 없음 — `supabase/migrations/20260726000000_create_profiles_table.sql`), `'admin'` 값을 코드 레벨 상수로만 정의한다(DB 체크 제약은 추가하지 않아 향후 역할 확장에 열어둠).
- **`is_admin()` SECURITY DEFINER 함수**: `auth.uid()`로 `profiles.role = 'admin'`을 확인해 boolean 반환. `profiles` SELECT RLS를 다시 타지 않도록 함수 내부에서 `set search_path = ''`로 직접 테이블을 조회 — Phase 3의 `room_members` 자기 참조 무한 재귀와 같은 함정을 피하기 위해 **관리자 판별 함수는 어떤 정책의 `using`/`with check` 절에서도 재귀적으로 자기 자신이 걸려 있는 테이블을 다시 정책 평가로 조회하지 않는다**(SECURITY DEFINER는 RLS를 우회하므로 원천적으로 안전하지만, 실수로 일반 클라이언트 supabase 인스턴스를 재사용하지 않도록 함수 본문에서 검토).
- **라우트 보호는 미들웨어가 아니라 화면(레이아웃) 레벨에서** — `/rooms/new`가 로그인 여부를 화면에서 판별하던 기존 패턴(§3.4)과 동일하게, `middleware.ts`의 `isPublicPath`에 `/admin`을 추가하지 않아 **로그인 자체는 기존 로직대로 미들웨어가 막고**(비로그인 → `/auth/login`), 그 위에 `app/admin/layout.tsx`(Server Component)가 `is_admin()` RPC를 호출해 관리자가 아니면 `notFound()`로 404를 반환한다(리다이렉트 대신 404를 선택 — 관리자 경로가 존재한다는 사실 자체를 비관리자에게 노출하지 않기 위해, `ROADMAP.md` Phase 7.5 접근 제어 항목의 "존재 자체를 노출하지 않는 쪽" 결정).
- **모든 관리자 서버 액션/Route Handler는 자체적으로 `is_admin()`을 재검증**한다 — 레이아웃의 404는 화면 진입만 막을 뿐, 액션 호출 자체는 별도 방어선이 필요하다(이 프로젝트에서 반복된 "서버 측 재검증" 원칙, §Phase 7).

### 7.5.2 DB 마이그레이션

| # | 파일명 | 내용 |
|---|---|---|
| 1 | `20260810000000_create_is_admin_function.sql` | `is_admin()` SECURITY DEFINER 함수(§7.5.1) |
| 2 | `20260810010000_create_reports_table.sql` | `reports` 테이블 + RLS(§7.5.3) — 신고자는 자신이 만든 신고만 INSERT/SELECT, 관리자는 `is_admin()`으로 전체 SELECT/UPDATE 허용 |
| 3 | `20260810020000_create_admin_audit_logs_table.sql` | `admin_audit_logs` 테이블 + RLS — SELECT는 `is_admin()`만, INSERT/UPDATE/DELETE는 `authenticated`/`anon`에게서 전부 REVOKE(§7.5.6 로깅 함수로만 기록) |
| 4 | `20260810030000_create_admin_read_functions.sql` | 관리자 전용 조회 SECURITY DEFINER 함수 모음(§7.5.4) — `admin_search_rooms(query)`(진행 중), `admin_get_room_messages(room_id)`, `admin_get_room_archive_list(query)`/`admin_get_room_archive_detail(archive_id)`, `admin_search_random_sessions(query)`(진행 중 — 참여자 id/기간), `admin_get_random_session_messages(session_id)`, `admin_get_random_archive_list(query)`/`admin_get_random_archive_detail(archive_id)`, `admin_search_users(query)`, `admin_get_user_detail(user_id)`. 전부 시작부에 `if not is_admin() then raise exception 'not_authorized'; end if;`로 재검증 |
| 5 | `20260810040000_create_admin_action_functions.sql` | 관리자 조치 SECURITY DEFINER 함수 모음(§7.5.5) — `admin_force_delete_room(room_id, reason)`, `admin_force_end_random_session(session_id, reason)`, `admin_suspend_user(user_id, reason, until)`, `admin_unsuspend_user(user_id)`, `admin_force_delete_account(user_id, reason)`, `admin_resolve_report(report_id, action_taken)`, `admin_dismiss_report(report_id)`. 각 함수 마지막에 `admin_audit_logs` INSERT(§7.5.6) |
| 6 | `20260810050000_add_suspension_columns_to_profiles.sql` | `profiles`에 `suspended_at timestamptz`, `suspended_until timestamptz`, `suspended_reason text` 추가 — 정지 여부는 `suspended_until is null or suspended_until > now()`로 판단(정지 이력은 남기고 해제 시 `suspended_until = now()`로 갱신, 행 삭제 안 함) |
| 7 | `20260810060000_block_suspended_users_from_actions.sql` | `join_room()`, `match_or_wait()`, `sendRoomMessageAction`이 참조하는 메시지 INSERT RLS 등 기존 SECURITY DEFINER 함수 상단에 정지 여부 체크 추가(정지된 계정은 로그인은 되지만 방 입장/매칭/메시지 전송이 거부됨) — 로그인 자체를 막지 않는 이유: 강제 탈퇴와 달리 "정지"는 재로그인 시 상태를 확인할 수 있어야 하므로 |
| 8 | `20260810070000_add_messages_content_trgm_index.sql` | `messages`에 `content_type = 'text'`인 행만 대상으로 하는 부분 GIN trgm 인덱스 추가(`create index messages_content_trgm_idx on public.messages using gin (content gin_trgm_ops) where content_type = 'text'`) — §7.5.7 메시지 검색(진행 중 메시지 쪽)이 순차 스캔 없이 `ilike '%keyword%'`를 태우기 위함. `pg_trgm` 확장은 Phase 3에서 이미 활성화됨(`profiles_username_trgm_idx`와 동일 패턴) |
| 9 | `20260810080000_create_admin_search_messages_function.sql` | `admin_search_messages(p_query text, p_date_from timestamptz, p_date_to timestamptz, p_scope text default 'all')` SECURITY DEFINER 함수(§7.5.7) |

마지막에 `mcp__supabase__generate_typescript_types`로 `lib/supabase/database.types.ts` 재생성.

### 7.5.3 `reports` / `admin_audit_logs` 스키마

```sql
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('room', 'random_session', 'message', 'user')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'abuse', 'illegal', 'other')),
  detail text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  action_taken text,
  created_at timestamptz not null default now()
);

create index reports_status_created_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;
revoke all on public.reports from public, anon;

-- 신고자는 자신이 만든 신고만 조회, 관리자는 전체 조회/처리
create policy "reporters can view own reports"
  on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

create policy "authenticated can create reports"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
-- UPDATE는 정책 없음 — admin_resolve_report()/admin_dismiss_report() SECURITY DEFINER 함수로만 처리
```

```sql
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete set null,
  action text not null,             -- 'force_delete_room' | 'suspend_user' | ... (§7.5.2 함수명과 1:1 매칭)
  target_type text not null,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_idx on public.admin_audit_logs (created_at desc);

alter table public.admin_audit_logs enable row level security;
revoke all on public.admin_audit_logs from public, anon, authenticated;

create policy "admins can view audit logs"
  on public.admin_audit_logs for select to authenticated
  using (public.is_admin());
-- INSERT는 정책 없음 — 관리자 조치 함수 내부에서 SECURITY DEFINER로만 기록, 클라이언트가 직접 못 씀
```

기록 범위는 "조치만"으로 한정한다(단순 열람까지 감사 로그에 남기면 §7.5.4의 조회 함수 호출마다 INSERT가 발생해 대시보드 클릭 한 번에도 로그가 쌓이는 부담이 있고, PRD상 요구되는 것은 제재 조치의 추적성이므로).

### 7.5.4 신규/변경 파일 — 대화·이미지 조회

`chat-images` Storage RLS는 "해당 방/세션의 현재 참여자"에게만 SELECT를 허용하므로(§Phase 6), 방이 삭제되거나 세션이 종료되면 관리자 계정으로도 일반 클라이언트로는 조회할 수 없다. 관리자 열람은 **서비스 롤 키 경로**로만 만든다.

**설계 수정(사용자 피드백 반영)**: 최초 초안은 "진행 중인 방"(`/admin/rooms`)과 "종료된 방 아카이브"(`/admin/archives/rooms`)를 서로 다른 메뉴로 분리했고, **랜덤채팅은 진행 중인 세션을 조회하는 화면 자체가 아예 빠져 있었다**(아카이브만 있었음). "관리자가 지금 진행 중인 방채팅/랜덤채팅과 종료된 방채팅/랜덤채팅을 편리하게 확인하는 것"이 이 Phase의 핵심 요구사항이므로, 아래처럼 **방채팅/랜덤채팅 각각 하나의 화면 안에서 "진행 중" / "종료됨" 탭으로 전환**하는 구조로 바꾼다 — 관리자가 별도 메뉴를 오가지 않고 한 화면에서 상태만 탭으로 바꿔가며 확인할 수 있다.

| 파일 | 상태 | 설명 |
|---|---|---|
| `lib/queries/admin.ts` | 신규 | `getDashboardStats()`, `getActiveRoomList(query)`/`getRoomArchiveList(query)`, `getRoomMessageTimeline(roomId)`(`admin_get_room_messages` RPC), `getRoomArchiveDetail(archiveId)`, `getActiveRandomSessionList(query)`/`getRandomArchiveList(query)`, `getRandomSessionTimeline(sessionId)`(`admin_get_random_session_messages` RPC), `getRandomArchiveDetail(archiveId)`, `searchAdminUsers(query)`(`admin_search_users` RPC), `getAdminUserDetail(userId)`, `getReportQueue(status)`, `getReportDetail(id)`, `getRateLimitAnomalies()`(`rate_limit_events` 집계 — §Phase 7 "이월" 메모대로 재사용), `getCronJobStatus()`(`cron.job_run_details` 조회, Supabase가 `pg_cron` 확장에 제공하는 시스템 뷰) — 전부 `is_admin()` RPC가 지켜주는 SECURITY DEFINER 함수 위에서 동작하므로 함수 자체는 얇게 유지 |
| `app/actions/admin.ts` | 신규 | `forceDeleteRoomAction`, `forceEndRandomSessionAction`(§7.5.5, 진행 중인 랜덤 세션 강제 종료 — 방 강제 삭제와 대응되는 랜덤채팅 쪽 조치), `suspendUserAction`, `unsuspendUserAction`, `forceDeleteAccountAction`(`auth.admin.deleteUser` 호출 전 `admin_audit_logs` 기록 — 계정 탈퇴 액션과 동일하게 `createAdminClient()` 사용), `resolveReportAction`, `dismissReportAction`. 각 액션은 (1) `getClaims()`로 로그인 확인 (2) `is_admin()` RPC로 재검증 (3) DB 함수 호출 순서 — RPC/DB 함수가 이미 `is_admin()`을 검사하지만 액션 레벨에서도 얇게 재확인해 잘못된 UI 노출 시에도 조기에 거부 |
| `app/api/admin/chat-image-url/route.ts` | 신규 | GET Route Handler, `?path=` 쿼리로 Storage 경로를 받는다. 요청자의 세션 supabase 클라이언트로 `is_admin()` RPC 확인 → 통과 시 `createAdminClient()`(서비스 롤)로 `createSignedUrl()` 발급해 반환. RLS를 완전히 우회하므로 이 라우트 자체가 유일한 방어선 — 반드시 라우트 안에서 매 요청마다 `is_admin()`을 확인하고, 절대 경로 파라미터를 검증 없이 그대로 서비스 롤 클라이언트에 넘기지 않는다(`lib/storage/chat-images.ts`의 `parseChatImagePath()`로 형식 검증 후 사용). **진행 중인 방/세션의 이미지도 이 경로 하나로 통일**해서 쓴다 — 참여자 기준 RLS로 조회되는 일반 서명 URL 발급과 별도로 관리자 전용 경로를 유지해야 진행 중/종료 여부에 따라 두 가지 발급 방식을 분기하지 않아도 된다(§`components/admin/message-timeline.tsx`가 활성/아카이브 여부와 무관하게 항상 이 라우트만 호출) |
| `app/admin/layout.tsx` | 신규 | Server Component. `supabase.auth.getUser()` + `is_admin()` RPC → 실패 시 `notFound()`(§7.5.1). `AdminSidebar` + 컨텐츠 영역 렌더링. `(main)` 그룹과 분리된 별도 레이아웃(`BottomNav`/`SidebarNav` 없음) |
| `app/admin/page.tsx` | 신규 | 대시보드 — 가입자 수, DAU(`last_seen_at` 24시간 이내), 활성 방/랜덤 세션 수, 오늘 메시지 수, 대기 중 신고 수, `rate_limit_events` 이상 활동 상위 N명. "진행 중인 방/세션" 카드는 각각 §아래 목록 화면으로 바로 링크(관리자가 대시보드에서 곧장 지금 벌어지고 있는 대화로 진입) |
| `app/admin/rooms/page.tsx` | 신규 | **방채팅 통합 조회 화면**. 상단 탭 `진행 중`/`종료됨` — `진행 중` 탭은 `getActiveRoomList()`(제목·방장 닉네임 검색, 실시간 인원수 표시), `종료됨` 탭은 `getRoomArchiveList()`(`room_archives` 검색, 삭제 시각·삭제 사유 표시). 탭 상태는 `?status=active\|archived` 쿼리로 관리해 URL 공유·새로고침에도 유지 |
| `app/admin/rooms/[roomId]/page.tsx` | 신규 | 진행 중인 방 상세 — `MessageTimeline`(실시간 갱신, §아래) + 참여자 목록 + "강제 삭제" 버튼(`ConfirmDialog` + 사유 입력) |
| `app/admin/rooms/archived/[archiveId]/page.tsx` | 신규 | 종료된 방 상세 — 스냅샷 시점의 제목/참여자 목록/전체 메시지를 `MessageTimeline`으로 표시(읽기 전용, 조치 버튼 없음 — 이미 삭제된 방이므로) |
| `app/admin/random/page.tsx` | 신규 | **랜덤채팅 통합 조회 화면(신규 — 최초 초안엔 없었음)**. 상단 탭 `진행 중`/`종료됨` — `진행 중` 탭은 `getActiveRandomSessionList()`(참여자 id·시작 시각), `종료됨` 탭은 `getRandomArchiveList()`(`random_session_archives` 검색, 참여자 id/기간). 랜덤채팅은 신원이 익명이라 검색은 사용자 id 또는 기간 기준으로만 가능(닉네임 검색 불가 — PRD상 랜덤채팅 자체가 익명 대화라는 전제와 일관) |
| `app/admin/random/[sessionId]/page.tsx` | 신규 | 진행 중인 랜덤 세션 상세(신규) — `MessageTimeline` + "세션 강제 종료" 버튼. 종료 즉시 §Phase 5.5의 기존 종료 파이프라인(`end_random_session`)을 관리자 컨텍스트에서 호출해 60초 뒤 자동 아카이브되는 기존 흐름을 그대로 탄다 |
| `app/admin/random/archived/[archiveId]/page.tsx` | 신규 | 종료된 랜덤 세션 상세 — 스냅샷 메시지를 `MessageTimeline`으로 표시(읽기 전용) |
| `app/admin/users/page.tsx` | 신규 | 회원 목록(`profiles`, 게스트 제외) — 닉네임/이메일/가입일/최근 접속/정지 상태, 검색·정렬. 게스트 현황(`guest_profiles` count, 최근 정리 배치 실행 시각)은 이 페이지 상단 요약 카드로 함께 표시 |
| `app/admin/users/[userId]/page.tsx` | 신규 | 회원 상세 — 참여 중인 방, 최근 대화 이력(아카이브 포함, 위 통합 화면으로 링크), 본인 대상 신고 이력, "정지"/"정지 해제"/"강제 탈퇴" 액션 |
| `app/admin/reports/page.tsx` | 신규 | 신고 큐 — 상태별(대기/처리완료/기각) 탭, 대상 유형·사유·신고일 목록 |
| `app/admin/reports/[reportId]/page.tsx` | 신규 | 신고 상세 — 대상(방/세션/메시지/사용자) 컨텍스트 미리보기 링크(위 통합 조회 화면의 상세 페이지로 직결) + "처리"(조치 내용 입력)/"기각" 액션 |
| `app/admin/system/page.tsx` | 신규 | pg_cron 배치 최근 실행 결과(게스트 정리, 아카이브 정리, 유령 세션 정리, 채팅 이미지 정리) — `cron.job_run_details` 조회 |
| `components/admin/admin-sidebar.tsx` | 신규 | 관리자 전용 좌측 네비(대시보드/방채팅/랜덤채팅/회원/신고/시스템) — "아카이브"는 별도 메뉴로 두지 않고 방채팅/랜덤채팅 화면 내부 탭으로 흡수. 일반 `SidebarNav`와 별도 컴포넌트로 분리(권한 성격이 다른 화면을 같은 컴포넌트에 조건부로 섞지 않기 위해) |
| `components/admin/data-table.tsx` | 신규 | 기존 `components/ui/table.tsx` 위에 페이지네이션·검색 인풋을 얹은 얇은 래퍼 — 방/세션/회원/신고 목록 화면 공통 사용 |
| `components/admin/status-tabs.tsx` | 신규 | `진행 중`/`종료됨` 탭 UI(shadcn `Tabs` 래핑) + `?status=` 쿼리 동기화 — 방채팅/랜덤채팅 통합 화면 공통 사용 |
| `components/admin/message-timeline.tsx` | 신규 | 방/세션 메시지를 시간순으로 렌더링, 진행 중/종료됨(아카이브) 데이터 형태 차이를 `props`로 흡수해 **동일한 컴포넌트로 양쪽을 렌더링**(관리자 입장에서 "진행 중이든 종료됐든 같은 방식으로 읽힌다"는 일관성이 목적). 이미지 메시지는 `/api/admin/chat-image-url?path=...`를 호출해 받은 서명 URL로 표시(기존 `ChatMessageBubble` 재사용하지 않고 열람 전용 단순 뷰로 별도 작성 — 관리자 화면은 전송 UI가 필요 없음) |
| `components/admin/report-action-panel.tsx` | 신규 | 신고 상세의 처리/기각 폼 |
| `components/admin/suspend-user-dialog.tsx` | 신규 | 정지 사유 + 기간(select: 1일/7일/30일/영구) 입력 다이얼로그 |
| `components/rooms/report-button.tsx`, `components/random/report-button.tsx` | 신규 | **일반 사용자 화면**에 추가하는 신고 진입점(§7.5.0 신고 접수 UI는 관리자 화면이 아니라 일반 채팅 화면에 필요, `ROADMAP.md` 운영 기능 항목 참고) — `ChatHeader`의 더보기 메뉴에 "신고하기" 추가, 사유 선택 다이얼로그 → `createReportAction` 호출 |
| `app/actions/reports.ts` | 신규 | `createReportAction(targetType, targetId, reason, detail)` — 로그인 확인(`getClaims()`) 후 `reports` INSERT. 게스트(익명 세션)도 랜덤채팅에서는 신고할 수 있어야 하므로 `authenticated`(익명 세션 포함) 기준으로 허용 — `join_room`류와 동일하게 익명 세션도 `authenticated` role이라는 이 프로젝트의 기존 전제를 따름 |

### 7.5.5 관리자 조치 함수 설계 메모

- `admin_force_delete_room(room_id, reason)`: `rooms` DELETE 실행 — BEFORE DELETE 트리거(§Phase 7)가 자동으로 `room_archives`에 스냅샷을 남기므로 함수는 삭제 + 감사 로그 기록만 하면 된다.
- `admin_force_end_random_session(session_id, reason)`: 방 강제 삭제와 대응되는 랜덤채팅 쪽 조치 — `random_sessions.status`를 `'ended'`로 갱신(기존 `end_random_session()`과 동일하게 상태만 바꾸고 즉시 삭제하지 않음, §Phase 5.5의 "종료 실시간 알림 누락" 수정과 같은 이유로 삭제는 60초 지연 cron이 처리) → 남아있던 상대방 화면에도 기존 세션 종료 파이프라인(Presence/하트비트 감지와 무관하게 이 UPDATE 자체가 트리거) 그대로 반영된다. 새 삭제/아카이브 경로를 따로 만들지 않고 기존 흐름에 편승하는 것이 핵심.
- `admin_force_delete_account(user_id, reason)`: 기존 계정 탈퇴 서버 액션이 쓰는 `auth.admin.deleteUser`와 동일 경로를 관리자 컨텍스트에서 호출 — `profiles` 삭제 → 소유 `rooms` cascade 삭제 → 트리거가 각각 아카이브. 탈퇴 액션과 로직을 공유할 수 있으면 `app/actions/account.ts`의 핵심 삭제 함수를 재사용하고 admin 쪽은 "본인 확인" 단계만 "대상 user_id + 관리자 권한 확인"으로 바꾼 얇은 래퍼로 구현(중복 구현 방지).
- `admin_suspend_user(user_id, reason, until)` / `admin_unsuspend_user`: `profiles.suspended_*` 컬럼만 갱신 — 로그인·조회는 막지 않고, §7.5.2 (7)에서 추가하는 행위별 체크(방 입장/매칭/메시지 전송/이미지 업로드)만 거부한다.
- `admin_resolve_report(report_id, action_taken)` / `admin_dismiss_report(report_id)`: `reports.status`/`reviewed_by`/`reviewed_at`/`action_taken` 갱신. 조치(강제 삭제·정지)는 관리자가 신고 상세 화면에서 별도 버튼으로 먼저 실행한 뒤 "처리 완료"로 신고를 닫는 2단계 흐름 — 신고 처리 자체가 자동으로 강제 조치를 트리거하지 않는다(오탐 신고로 즉시 삭제되는 사고 방지).

### 7.5.6 메시지 내용 검색 (사용자 피드백 반영 — 신규)

`ROADMAP.md` Phase 7.5의 "기간·사용자·키워드 기준 메시지 검색" 항목을 구체화한다. 대화 내용을 진행 중 메시지와 아카이브(jsonb 스냅샷) 양쪽에서 검색해야 하는데, 두 저장 형태의 검색 비용이 서로 다르다는 점이 설계의 핵심이다.

- **진행 중 메시지**(`messages` 테이블, 행 단위 저장): §7.5.2 (8)의 부분 trgm 인덱스로 `ilike` 검색이 인덱스를 타므로 날짜 범위 없이도 비교적 저렴하지만, 그래도 기본 검색 범위는 최근 7일로 좁혀 결과를 좁힌다(넓히려면 사용자가 직접 날짜를 늘림).
- **아카이브 메시지**(`room_archives`/`random_session_archives.messages jsonb`, **행 하나가 대화 전체를 통째로 담고 있어 인덱스를 태우기 어려움**): `jsonb_array_elements(messages)`로 펼쳐서 검색해야 하므로, **날짜 범위(`archived_at`/`started_at` 기준)로 먼저 대상 행을 좁힌 뒤에만** jsonb를 펼친다 — 날짜 필터 없이 전체 아카이브를 펼치는 경로는 아예 만들지 않는다(사용자가 요청한 "DB 전체 조회가 부담되면 날짜로 제한" 그대로 반영). 어차피 두 아카이브 테이블 모두 30일 보존 정책(§Phase 4, §Phase 6)으로 자동 정리되므로 최대 스캔 범위 자체가 30일로 이미 상한이 있지만, 그 안에서도 기본 조회는 최근 7일로 더 좁혀 시작한다.

```sql
create or replace function public.admin_search_messages(
  p_query text,
  p_date_from timestamptz,
  p_date_to timestamptz,
  p_scope text default 'all' -- 'active_rooms' | 'active_random' | 'archived_rooms' | 'archived_random' | 'all'
)
returns table (
  source text,           -- 'room' | 'random_session' | 'room_archive' | 'random_archive'
  context_id uuid,        -- 방/세션/아카이브 id (상세 화면 링크용)
  sender_id uuid,
  content text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not_authorized';
  end if;
  if p_date_from is null or p_date_to is null then
    raise exception 'date_range_required'; -- 날짜 범위는 선택이 아니라 필수 — 무제한 스캔 경로 원천 차단
  end if;

  return query
  -- 진행 중인 방 메시지 (trgm 인덱스 활용)
  select 'room', m.room_id, m.sender_id, m.content, m.created_at
  from public.messages m
  where p_scope in ('all', 'active_rooms')
    and m.room_id is not null
    and m.content_type = 'text'
    and m.content ilike '%' || p_query || '%'
    and m.created_at between p_date_from and p_date_to

  union all

  -- 진행 중인 랜덤 세션 메시지
  select 'random_session', m.session_id, m.sender_id, m.content, m.created_at
  from public.messages m
  where p_scope in ('all', 'active_random')
    and m.session_id is not null
    and m.content_type = 'text'
    and m.content ilike '%' || p_query || '%'
    and m.created_at between p_date_from and p_date_to

  union all

  -- 종료된 방 아카이브 — 날짜로 먼저 행을 좁힌 뒤에만 jsonb 펼침
  select 'room_archive', ra.id, (elem->>'sender_id')::uuid,
         elem->>'content', (elem->>'created_at')::timestamptz
  from public.room_archives ra,
       jsonb_array_elements(ra.messages) elem
  where p_scope in ('all', 'archived_rooms')
    and ra.archived_at between p_date_from and p_date_to
    and elem->>'content_type' = 'text'
    and elem->>'content' ilike '%' || p_query || '%'

  union all

  -- 종료된 랜덤 세션 아카이브
  select 'random_archive', rsa.id, (elem->>'sender_id')::uuid,
         elem->>'content', (elem->>'created_at')::timestamptz
  from public.random_session_archives rsa,
       jsonb_array_elements(rsa.messages) elem
  where p_scope in ('all', 'archived_random')
    and rsa.archived_at between p_date_from and p_date_to
    and elem->>'content_type' = 'text'
    and elem->>'content' ilike '%' || p_query || '%'

  order by created_at desc
  limit 200;
end;
$$;
```

- 날짜 범위는 함수 시그니처 레벨에서 `not null` 요구가 아니라 함수 본문에서 명시적으로 거부한다 — RPC 호출부(UI)가 실수로 null을 넘기더라도 서버가 항상 막도록.
- `p_query`가 2자 미만이면 (검색 화면단에서, §4.4의 사용자 검색과 동일한 기존 전제) 호출 자체를 하지 않도록 클라이언트에서 막는다 — trgm 인덱스도 너무 짧은 패턴은 선택도가 낮아 비효율적이다.
- 결과 200건 상한은 "검색"이지 "전체 export"가 아니라는 전제 — 더 필요하면 날짜 범위를 좁혀 재검색하도록 UI에서 안내(페이지네이션 대신 범위 좁히기를 유도, 아카이브 jsonb 특성상 offset 기반 페이지네이션이 비효율적이므로).

| 파일 | 상태 | 설명 |
|---|---|---|
| `lib/queries/admin.ts` | 변경(§7.5.4 목록에 추가) | `searchAdminMessages(query, dateFrom, dateTo, scope)` — `admin_search_messages` RPC 호출, 기본 `dateFrom`/`dateTo`는 호출부(화면)에서 "최근 7일"로 계산해 전달(쿼리 함수 자체는 얇게 유지하는 기존 패턴) |
| `app/admin/messages/page.tsx` | 신규 | 통합 메시지 검색 화면 — 키워드 입력 + 날짜 범위 피커(기본 최근 7일, 최대 30일 — 아카이브 보존 기한과 동일하게 UI에서도 제한해 헛수고 방지) + 범위 토글(방채팅/랜덤채팅/전체 × 진행중/아카이브/전체). 결과 행 클릭 시 `source`에 따라 `/admin/rooms/[roomId]`, `/admin/random/[sessionId]`, `/admin/rooms/archived/[archiveId]`, `/admin/random/archived/[archiveId]`로 이동(§7.5.4의 상세 화면과 연결) |
| `components/admin/message-search-panel.tsx` | 신규 | 검색어/날짜/범위 폼 + 결과 리스트(발신자, 내용 스니펫, 시각, 출처 배지) — `components/admin/data-table.tsx` 재사용 |
| `components/admin/admin-sidebar.tsx` | 변경(§7.5.4 목록 수정) | 네비에 "메시지 검색" 항목 추가 |

### 7.5.7 완료 조건 및 검증

- `npm run check-all` + `npm run build` 통과
- `mcp__supabase__get_advisors`(security)로 신규 테이블(`reports`, `admin_audit_logs`) 및 `profiles` 컬럼 추가 후 RLS 점검 — 이 프로젝트에서 반복된 함정(publication 미등록, REPLICA IDENTITY, 자기 참조 재귀)이 이번엔 해당 없음을 확인(신규 테이블은 Realtime 구독 대상이 아니므로 publication 등록 불필요)
- 비관리자 계정으로 `/admin` 접근 시 404 확인, 관리자 계정으로는 정상 진입 확인
- 관리자 조치 함수(`admin_*`)를 비관리자 `auth.uid()`로 SQL 직접 호출해 전부 `not_authorized` 예외로 거부되는지 확인(레이아웃의 404를 우회해도 서버 측 재검증이 막는지가 핵심 — §Phase 7에서 확립한 검증 방식과 동일하게 `set local role authenticated` + `request.jwt.claims`로 역할 전환해 재현)
- 삭제된 방/종료된 세션의 이미지가 `/api/admin/chat-image-url`로는 정상 조회되고, 참여자가 아닌 관리자가 아닌 계정으로 같은 경로를 호출하면 거부되는지 확인
- **핵심 시나리오**: 실제 방채팅/랜덤채팅을 하나씩 진행 중인 상태로 만들어두고, 관리자 화면에서 `/admin/rooms`·`/admin/random`의 "진행 중" 탭에 즉시 노출되는지, 상세 진입 시 실시간으로 새 메시지가 타임라인에 반영되는지 확인 → 이후 방을 나가기/세션을 종료해 "종료됨" 탭으로 넘어가는지, 종료 후에도 같은 `MessageTimeline` 컴포넌트로 동일한 대화 내용(이미지 포함)이 그대로 보이는지 확인(진행 중 → 종료 전환 시 관리자가 다른 화면을 헤매지 않고 탭만 바꾸면 되는지가 이번 Phase의 핵심 요구사항)
- 신고 접수(일반 사용자 화면) → 신고 큐에 노출 → 상세에서 강제 삭제/정지 실행 → 신고 처리 완료로 상태 전환까지 Playwright로 전체 흐름 1회 재현
- 정지된 계정으로 방 입장/매칭/메시지 전송 시도 시 거부되는지, 로그인 자체는 여전히 되는지 확인
- 대시보드 지표(가입자 수, DAU, 활성 방/세션 수)가 SQL로 직접 집계한 값과 일치하는지 대조
- 메시지 검색(§7.5.6) — 날짜 범위 없이 `admin_search_messages`를 호출(SQL 직접 호출)하면 `date_range_required`로 거부되는지 확인, 진행 중 메시지·아카이브 메시지 각각에 대해 키워드 검색 결과가 실제로 매칭되는지, 결과 클릭 시 해당 방/세션 상세로 정상 이동하는지 확인

**연관 PRD**: §7.4 후속 검토(운영자 관리 화면), §7.1 권한 검증 — `ROADMAP.md` Phase 7.5와 동일

### 구현 완료 (2026-08-10)

계획대로 마이그레이션 9건 + 구현 중 추가된 1건(총 10건), `app/admin/*` 전 화면, `app/actions/admin.ts`,
`app/actions/reports.ts`, `lib/queries/admin.ts`, `components/admin/*`, 일반 사용자 신고 진입점을
구현했다. `npm run check-all`/`npm run build` 통과, `get_advisors`(security) 점검 완료(신규 이슈 없음).
상세 검증 내역과 계획 대비 달라진 점은 `ROADMAP.md` Phase 7.5 "구현 완료 (2026-08-10)" 절 참고 —
요약하면 (1) `add_suspension_columns_to_profiles` 마이그레이션을 계획보다 앞당겨 적용(뒤 함수들이
그 컬럼을 참조하므로), (2) 참여자가 아닌 방의 참여자 목록을 관리자가 볼 수 없던 문제를 해결하기 위해
계획에 없던 `admin_get_room_members()` 함수 추가, (3) `ChatHeader` 드롭다운 안에 `Dialog`를 직접
중첩할 수 없는 Radix 제약 때문에 `report-button.tsx`를 자체 트리거 없는 controlled dialog로 구현,
(4) 회원 상세 화면의 "최근 대화 이력"은 방별 링크 대신 참여 중인 방 개수로 단순화(대화 열람은 이미
통합 조회 화면에서 가능하므로 중복 UI를 만들지 않음), (5) 관리자 계정은 계획대로 SQL로 직접 지정
(`rudvy9@gmail.com`).

**실제 브라우저 검증 및 버그 수정 (2026-08-09)**: `check-all`/`build` 통과만으로는 안 잡히는 런타임
버그 2건을 Playwright 실사용 테스트로 발견·수정했다 — (1) `DataTable`이 `"use client"`인 채로 각
페이지(Server Component)의 `columns[].render` 함수를 prop으로 받아 `/admin/rooms`·`random`·
`users`·`reports` 4개 화면이 전부 500 에러였던 문제(`DataTable`에서 `"use client"` 제거 + 검색
인풋만 `data-table-search-input.tsx`로 분리), (2) `MessageTimeline`의 시각 표시가 서버/클라이언트
로케일 불일치로 hydration mismatch를 내던 문제(`suppressHydrationWarning` 추가 — 같은 현상이
일반 채팅 화면에도 있는 pre-existing 이슈임을 발견했으나 이번 Phase 범위 밖이라 미수정). 상세 검증
시나리오는 `ROADMAP.md` Phase 7.5 "실제 브라우저 검증 및 버그 수정" 절 참고.

## Phase 7.7 — 법적/규정 준수 (상세)

`ROADMAP.md` Phase 7.7 대응. 이 Phase는 법률 자문을 대체하지 않는다 — 아래 설계는 "무엇을
구현하면 되는지"에 대한 개발 관점 실행계획이고, ③ 콘텐츠·안전 항목의 최종 채택 여부는
변호사 검토 후 확정한다(`ROADMAP.md` Phase 7.7 상단 면책 고지 참고).

### 7.7.0 착수 시점 현황 재확인

`ROADMAP.md` 작성 시 조사한 내용에 더해, 실행계획 작성 중 **추가로 발견한 구조적 문제**가
하나 있다.

| 항목 | 상태 |
|---|---|
| 나이 검증 로직(`ageSchema`, 만 14~120세) | `lib/schemas/profile.ts`에 이미 존재 — **문제는 검증 로직이 아니라 어떤 가입 경로가 이 검증을 거치는지** |
| OAuth(구글) 가입 시 나이/닉네임/성별 입력 | `app/auth/callback/route.ts`가 `profile.username`이 없으면 `/auth/setup-profile`로 강제 이동시켜 **보장됨** |
| **이메일/비밀번호 가입 시 나이/닉네임/성별 입력** | ⚠️ **전혀 보장되지 않음(신규 발견)** — `app/auth/confirm/route.ts`는 OTP 검증 후 무조건 `next`(기본 홈)로 리다이렉트할 뿐, `setup-profile` 이동 로직이 콜백 라우트에만 있고 이메일 확인 라우트에는 없다. `handle_new_user()` 트리거는 두 가입 경로 모두 `username`/`gender`/`age`가 `null`인 `profiles` 행만 만들기 때문에, **이메일로 가입한 사용자는 닉네임을 영영 설정하지 않아도 서비스를 계속 이용할 수 있는 상태**다(나이 제한 우회는 이 결함의 한 증상일 뿐) |
| 이용약관/개인정보처리방침 동의 | `sign-up-form.tsx`에 체크박스 없음, OAuth는 폼 자체가 없어 동의를 받을 지점이 아예 없음 |
| 닉네임/방 제목 금칙어 필터링 | 없음 |
| 이미지 자동 검열 | 없음 |
| 접속 로그(IP) 보관 | 없음(Vercel/Supabase 플랫폼 기본 로그만 존재) |

→ 결론: ①(가입 연령)과 ②(약관 동의)는 **사실상 같은 지점에서 함께 해결된다** — "로그인은
했지만 닉네임 설정이 안 끝난 사용자"를 이메일 가입 경로까지 포함해 하나의 관문(gate)으로
통일하면, 나이 검증 누락과 약관 동의 누락이 동시에 막힌다.

### 7.7.1 ① + ② 프로필 설정 관문 통합 (가입 연령 제한 + 약관 동의)

**설계**: OAuth 전용이던 "닉네임 없으면 setup-profile로 보낸다" 규칙을 **로그인 사용자
전체에 적용되는 공용 가드**로 옮긴다. 가입 경로(이메일/OAuth)에 따라 분기하지 않고
"지금 이 사람이 프로필을 다 채웠는가"만 본다 — 신규 가입 경로가 추가돼도 자동으로
안전해지는 방식이다.

- **위치**: `app/(main)/layout.tsx`(모든 서비스 화면이 거치는 공용 레이아웃, 이미
  `supabase.auth.getUser()` + `getUserProfile()` 호출 중이라 추가 쿼리 없이 판별 가능)
  ```ts
  // 기존 profile 조회 직후
  if (user && profile && !profile.username) {
    redirect(`/auth/setup-profile?next=${encodeURIComponent(pathname)}`);
  }
  ```
  단 `(main)` 레이아웃은 Server Component라 현재 경로(`pathname`)를 직접 못 받으므로,
  `next/headers`의 `headers()`로 `x-invoke-path` 또는 middleware에서 주입하는 방식 대신
  **간단히 `next` 파라미터 없이 무조건 `/auth/setup-profile`로만 보내고, setup-profile
  완료 후 홈(`/`)으로 리다이렉트**하는 쪽을 택한다 — 로그인 직후 1회성 온보딩 단계라
  원래 가려던 경로를 정확히 복원해야 할 만큼 중요하지 않고, 기존 OAuth 콜백의 `next`
  보존 로직은 그대로 둬도 무방하다(다른 진입 경로이므로 충돌 없음).
- **`app/auth/setup-profile/page.tsx`/`setup-profile-form.tsx`**: 기존 닉네임/성별/나이
  필드에 **이용약관·개인정보처리방침 동의 체크박스**(필수, 각 문서 링크 포함) 추가.
  체크 안 하면 제출 버튼 비활성화 — `lib/schemas/profile.ts`의 `setupProfileSchema`에
  `termsAgreed: z.literal(true, { message: "약관에 동의해야 가입할 수 있습니다" })` 추가.
- **DB**: `profiles`에 `terms_accepted_at timestamptz` 컬럼 추가(동의 시점 증빙용, 나중에
  약관이 개정되면 재동의 로직의 기준점으로도 재사용 가능). `setupProfileAction`/
  `updateProfileAction`(`app/actions/profile.ts`)에서 최초 설정 시 `now()`로 채운다.
  마이그레이션 예: `add_terms_accepted_at_to_profiles`.
- **`app/auth/confirm/route.ts`는 수정 불필요**: 위 방식대로 가드를 `(main)/layout.tsx`에
  두면, 이메일 확인 후 `next`(홈)로 갔다가 레이아웃 가드가 즉시 `setup-profile`로 다시
  돌려보내므로 확인 라우트 자체를 손댈 필요가 없다 — 가입 경로가 몇 개든 관문은 하나다.
- **나이 위조 한계는 그대로 인정**: `ageSchema`(만 14~120세)는 자기 입력 검증이라 위조가
  쉽다는 한계를 `ROADMAP.md`에 이미 명시했다. 이번 Phase에서는 "가입 경로와 무관하게 검증
  자체는 반드시 거치게" 만드는 것까지가 목표이고, 본인인증 연동은 별도 후속 항목으로 둔다.

**구현 완료 (2026-08-15)**: 위 설계대로 구현하고 Playwright로 이메일 가입 → setup-profile
강제 이동 → 약관 미동의/미성년자 동시 차단 → 정상 가입까지 재현 검증했다(§ROADMAP Phase 7.8).
단, 실사용 검증 중 **설계상 한계 하나를 발견**했다 — 가드 조건이 `!profile.username`이라
Phase 7.7 작업 이전에 이미 닉네임을 설정해둔 기존 계정은 이 관문을 다시 거치지 않아 약관
동의를 받지 못한 채 남는다. 서비스 미오픈 상태라 별도 백필 로직 대신 배포 시점 계정 초기화로
해결하기로 결정했다(§ROADMAP Phase 7.8 ③, Phase 9 체크리스트).

### 7.7.2 ② 약관·정책 페이지 신설

- **경로**: `app/legal/terms/page.tsx`, `app/legal/privacy/page.tsx`,
  `app/legal/youth-protection/page.tsx` — `(main)` 레이아웃(헤더/네비 포함) 밖에 두되
  비로그인도 조회 가능해야 하므로 `lib/supabase/middleware.ts`의 `isPublicPath`에
  `request.nextUrl.pathname.startsWith("/legal")` 추가. 로그인 상태에서 setup-profile
  화면의 링크로도 열람 가능해야 하니 `target="_blank"` 새 탭으로 연결(작성 중이던 폼
  입력값 보존).
- **내용 골격(법률 검토 전 초안 구조만 마련, 실제 문구는 변호사 검토 후 확정)**:
  - 이용약관: 서비스 정의, 이용 자격(만 14세 이상), 게시물(대화·이미지) 권리·책임,
    이용 제한(신고·정지·강제 탈퇴 근거), 수사기관 협조 조항
  - 개인정보처리방침: 수집 항목(이메일/닉네임/성별/나이/대화·이미지)/목적/보유기간,
    제3자 제공·처리위탁 현황(Supabase, Vercel), 국외이전 여부, 파기 절차, 이용자 권리
    (열람·정정·삭제 요청 방법)
  - 청소년보호정책: 청소년유해정보 차단·모니터링 방침, 신고 채널, 책임자 연락처
- **완료 조건**: 세 페이지 모두 실제 텍스트(법률 검토 완료본)로 채워지고, 회원가입
  경로(이메일+OAuth 공용 관문인 setup-profile) 어디서든 동의 없이는 가입이 끝나지 않는다.

### 7.7.3 ③ 콘텐츠·안전

**금칙어 자동 필터링 (닉네임/방 제목, MVP 범위)**

- `lib/utils/content-filter.ts` 신규 — 정적 한국어 금칙어 배열 + `containsBannedWord(text: string): boolean`.
  외부 유료 API 없이 로컬 배열/정규식 매칭으로 시작(초기 리스트는 성적 표현·연락처 유도
  패턴 위주로 최소 구성, 운영하며 신고 데이터 기반으로 보강).
- 적용 지점:
  - `lib/schemas/room.ts`의 `createRoomSchema.title`에 `.refine((v) => !containsBannedWord(v), ...)`
  - `lib/schemas/profile.ts`의 `username`(설정/수정 양쪽)에 동일하게 `.refine()` 추가
- **메시지 전송에는 적용하지 않음**(2026-08-15, 사용자 결정) — 실시간 대화 흐름이 차단되는
  것을 피하기 위해 `app/actions/messages.ts`의 `sendRoomMessageAction`/`sendRandomMessageAction`
  에는 필터를 연결하지 않는다. 메시지 단의 부적절 콘텐츠는 기존 신고 기능
  (`app/actions/reports.ts`)에 계속 의존한다.
- 완전한 검열이 목표가 아니라 **가장 명백한 케이스를 자동으로 걸러 신고 큐 부담을 줄이는 것**이
  이번 Phase의 현실적 목표임을 명시 — 정교한 필터링(동음이의어 우회 등)은 후속 개선.

**이미지 자동 검열 (결정 필요 항목)**

- MVP에서 바로 도입할지, 신고 기반 사후 대응으로 launch 후 관찰하며 결정할지는 **비용(상용
  API 연동)과 리스크(게스트도 업로드 가능) 사이의 트레이드오프**라 개발팀 단독 결정 대신
  법률 자문·운영 판단이 필요하다. 후보: AWS Rekognition Moderation, Google Cloud Vision
  SafeSearch — 둘 다 `app/actions/chat-images.ts`의 업로드 확정 단계(서명 URL 발급 후,
  또는 메시지 INSERT 직전)에 동기 호출로 끼워 넣을 수 있는 구조라 **나중에 추가해도 기존
  업로드 파이프라인을 크게 바꾸지 않는다** — 지금 당장 구현하지 않아도 설계상 손해가 없다는
  점만 확인해두고, 도입 여부는 별도 결정 사항으로 남긴다.

**아동성착취물(CSAM) 대응 절차 (문서화, 코드 아님)**

- `docs/CONTENT_SAFETY_PROCEDURE.md` 신규 — 발견 즉시 (1) `/admin`의 기존 강제 삭제
  기능으로 해당 메시지/방/세션 즉시 차단, (2) 원본 파일은 완전 삭제하지 않고 격리
  (수사 협조 목적 — Storage에서 일반 접근 불가능한 별도 경로로 이동하거나 접근 권한만
  차단), (3) 관계기관(방송통신심의위원회, 경찰청 사이버수사대 등) 신고 절차와 연락처를
  운영 매뉴얼로 정리. 이 항목은 실제 신고 채널·법적 요건이 확정되어야 완성되므로, 지금은
  "무엇을 정리해야 하는지" 목차만 잡아두고 변호사 자문 이후 채운다.

**신고 처리 우선순위**: 새 테이블/컬럼 추가 없이, `/admin/reports` 운영 정책에 "미성년자
관련 정황이 담긴 신고는 최우선 처리" 원칙을 문서로 명시하는 선에서 충분하다(현재 신고
큐는 최신순 정렬이라 이미 실시간에 가깝게 노출됨, MVP 트래픽 규모에서 별도 우선순위
필드는 과설계로 판단).

### 7.7.4 ④ 운영 체계

- **청소년보호책임자**: 코드 변경 없음 — `app/legal/youth-protection/page.tsx`에 이름/
  연락처 문구 섹션만 마련해두고 실제 지정은 운영 결정 사항.
- **부가통신사업 신고**: 코드 변경 없음 — 매출/이용자 규모가 신고 기준을 넘는지는 서비스
  성장 단계에서 재검토(사업자 등록 관련 사항이라 개발 범위 밖).
  - **접속 로그(IP) 보관**: 별도 로깅 테이블을 새로 만들기보다, **Vercel의 요청 로그와
  Supabase Auth 로그가 이미 일정 기간 보관되므로 MVP 단계에서는 이를 1차 근거로 삼고
  별도 구현은 보류**한다 — 지금 커스텀 로그 테이블을 추가하면 개인정보 보관 목적·기간을
  또 하나 만들어 관리 부담(그리고 개인정보보호법상 목적 외 과다 수집 리스크)만 늘어난다.
  플랫폼 로그의 보관 기간·접근 방법이 수사 협조에 충분한지는 법률 자문 시 함께 확인한다.
- **AdBanner 개인정보처리방침 반영**: 실제 광고 연동(Phase 10 범위) 시점에 함께 처리 —
  지금은 placeholder라 처리방침에 쓸 내용이 없다.

### 7.7.5 작업 순서 제안

1. ✅ DB 마이그레이션(`terms_accepted_at` 컬럼) + `lib/schemas/profile.ts`(약관 동의 필드,
   금칙어 refine) + `lib/utils/content-filter.ts` 신규
2. ✅ `app/legal/*` 3개 페이지 골격 작성(법률 검토 전 초안) + `middleware.ts` 공개 경로 추가
3. ✅ `app/(main)/layout.tsx` 프로필 완성도 가드 추가 + `setup-profile-form.tsx`에 동의
   체크박스·에러 메시지 연결
4. `lib/schemas/room.ts`(방 제목)에 금칙어 검증 연결 — ✅ 완료. 메시지 전송 액션 쪽은
   실시간 대화 흐름을 막지 않기 위해 적용하지 않기로 결정(2026-08-15, §ROADMAP Phase 7.7 ③)
5. ✅ `docs/CONTENT_SAFETY_PROCEDURE.md` 목차 작성(내용은 법률 검토 후 확정) — 완료,
   2026-08-15. 즉시 실행 가능한 조치(관리자 강제 삭제 연결, 신고 우선처리 원칙)까지 채웠고
   원본 격리 경로·관계기관 연락처는 미확정으로 명시
6. **법률 자문 반영 — 약관 문구 확정, 이미지 자동 검열 도입 여부 최종 결정 (미착수, 개발
   범위 밖)**
7. ✅ Playwright로 회원가입(이메일) → setup-profile 강제 이동 → 약관 미동의 시 제출 불가 →
   만 14세 미만 입력 시 차단 → 금칙어 포함 방 제목/메시지 차단까지 재현 검증 완료
   (§ROADMAP Phase 7.8)

## Phase 8 — UI/UX 마감 및 반응형 — 개요만

`ROADMAP.md` Phase 8 참고.

## Phase 9 — 배포 — 개요만

`ROADMAP.md` Phase 9 참고.

## Phase 10 — 후속 검토 — 범위 외

`ROADMAP.md` Phase 10 참고. MVP 범위 밖이므로 상세화하지 않는다.

## Phase 11 — 쪽지(DM, 쪽지함) (상세, 2026-08-17 구현 완료)

로그인 회원 간 단발성 쪽지. **1차 설계("1:1 영구 대화" — `feature/dm` 브랜치, 커밋
`7aed535`)는 폐기됐다** — 사용자가 실제로 원한 것은 포털 사이트류 "쪽지함"(낱개의 독립된
쪽지, 대화 스레드가 아님)이었다. 원격 Supabase에 적용됐던 1차 마이그레이션도
`20260817020000_rollback_dm_conversations_thread_design.sql`로 되돌렸다. 아래는 재설계된
쪽지함의 실제 구현 내역이다. 확정 요구사항은 `ROADMAP.md` Phase 11 참고.

### DB 설계

1차 설계가 `messages` 테이블을 확장하는 방식이었던 것과 달리, 이번엔 "대화" 그룹 개념
자체가 없으므로 **완전히 독립된 전용 테이블** `dm_notes`로 새로 만들었다.

- **`dm_notes`** — `id`, `sender_id`/`recipient_id`(`profiles(id)` 참조, `on delete cascade`),
  `content`(1~2000자), `reply_to_id`(자기 자신을 참조하는 nullable FK, `on delete set null`),
  `read_at`(nullable — 수신자가 읽으면 채워짐), `hidden_by_sender`/`hidden_by_recipient`(각자
  자기 쪽에서만 소프트 삭제), `created_at`. `sender_id <> recipient_id` 체크로 자기 자신에게
  보내는 것을 DB 레벨에서도 막는다.
- **RLS**: `auth.uid() in (sender_id, recipient_id)`인 행만 SELECT 가능 — 소프트 삭제
  플래그는 RLS가 아니라 애플리케이션 쿼리(`lib/queries/dm.ts`)에서 필터링한다. RLS에서까지
  숨기면 "내가 지워도 상대 쪽 사본은 유지"라는 요구사항 자체가 깨진다(상대는 여전히 그 행을
  봐야 하므로). INSERT/UPDATE/DELETE는 `authenticated`에서 전부 revoke하고 SECURITY DEFINER
  함수로만 가능하게 했다.
- **`send_dm_note(p_recipient_id, p_content, p_reply_to_id)`** — 로그인 여부·자기 자신 여부·
  게스트(`profiles`에 없음) 여부·수신자 존재 여부·정지 계정 여부를 전부 재검증. `reply_to_id`가
  있으면 호출자가 그 원본 쪽지의 참여자(발신 또는 수신)인지 확인해, 임의의 남의 쪽지를 답장
  대상으로 조작해 참조하지 못하게 막는다.
- **`mark_dm_note_read(p_note_id)`** — 수신자 본인이 자신에게 온 쪽지만 읽음 처리.
- **`hide_dm_note(p_note_id)`** — 호출자가 발신자면 `hidden_by_sender`만, 수신자면
  `hidden_by_recipient`만 갱신 — 방 나가기(`leave_room`)와 동일한 "나만 안 보이게" 개념으로,
  실제 행 DELETE는 하지 않는다.

마이그레이션: `supabase/migrations/20260817020000_rollback_dm_conversations_thread_design.sql`
(1차 설계 롤백), `20260817030000_create_dm_notes_mailbox.sql`(신규 구현).

### 애플리케이션 계층

- **`lib/queries/dm.ts`** — `getDmNoteList(userId)`(보낸/받은 쪽지를 하나로 합쳐 최신순 정렬,
  소프트 삭제 필터링, 상대 프로필 배치 조회), `getDmUnreadCount(userId)`(네비 배지용, RLS만으로
  충분해 별도 DB 함수 없이 일반 select), `getDmNoteDetail(noteId, viewerId)`(참여자 검증 +
  답장인 경우 원본 미리보기까지 조회).
- **`app/actions/dm.ts`** — `sendDmNoteAction`(신규 발송/답장 공용, `p_reply_to_id` 유무로
  구분), `markDmNoteReadAction`, `hideDmNoteAction`. 셋 다 `revalidatePath("/", "layout")`을
  호출해 (main) 레이아웃 전체(안읽음 배지 포함)를 재검증한다 — 실시간 구독 대신 이 방식으로
  "배지 갱신 정도만 고려"라는 요구사항을 충족한다.
- **화면**:
  - `app/(main)/dm/page.tsx` + `components/dm/dm-note-list.tsx` — 받은함/보낸함 탭 분리 없이
    통합 목록. 방향은 `ArrowDownLeft`(받음)/`ArrowUpRight`(보냄) 아이콘으로만 구분하고,
    안읽음은 굵은 글씨 + 점으로 강조한다. 항목의 "..." 메뉴에서 삭제하면 낙관적으로 목록에서
    즉시 제거하고, 실패 시 롤백한다.
  - `app/(main)/dm/[noteId]/page.tsx` + `components/dm/dm-note-detail.tsx` — 채팅 버블이
    아니라 편지 형태(발신자 카드 + 본문 + 답장 대상이면 원본 인용 블록)로 구성했다. 마운트
    시 받은 쪽지면 1회 자동 읽음 처리. "답장하기" 버튼을 누르면 인라인 textarea가 나타나고,
    전송하면 새 쪽지 1건을 만들고 목록으로 돌아간다 — 이 화면 자체가 이어지는 대화창이 되지
    않는다(요구사항의 핵심 차이점).
  - `app/(main)/dm/compose/page.tsx` + `components/dm/dm-compose-form.tsx` — 검색 결과/
    프로필 다이얼로그의 "쪽지 보내기"가 여기로 연결된다. "대화 시작" 개념이 없으므로 서버
    액션 호출 없이 그냥 `/dm/compose?to={userId}`로 라우팅만 하면 된다(1차 설계의
    `startOrGetDmConversationAction` 같은 조회/생성 단계가 아예 필요 없어졌다).
- **네비게이션**: `bottom-nav.tsx`/`sidebar-nav.tsx`에 "쪽지" 탭 추가, `unreadDmCount` prop을
  받아 0보다 크면 배지를 표시한다. `(main)/layout.tsx`가 `getDmUnreadCount()`를 렌더마다
  호출해 두 컴포넌트에 전달 — Server Component가 매 네비게이션마다 다시 실행되는 게 아니라
  캐시될 수 있다는 점을 고려해, 위 세 서버 액션이 `revalidatePath("/", "layout")`로 강제
  재검증한다.

### 1차 설계 대비 달라진 점 (요약)

| 항목 | 1차 설계(폐기) | 재설계(구현) |
|---|---|---|
| 데이터 모델 | `dm_conversations` + `messages` 3-way 확장 | 전용 테이블 `dm_notes` 1개 |
| 단위 | 대화(스레드) | 쪽지 1건(독립 행) |
| 목록 | 대화 목록(상대별 1행, 마지막 메시지 미리보기) | 쪽지 목록(항목별 1행, 방향 아이콘) |
| 진입점 동작 | `startOrGetDmConversationAction` 호출 후 대화로 이동 | 바로 `/dm/compose`로 라우팅 |
| 실시간성 | Realtime 즉시 전달(`useDmMessages`) | 불필요 — 조회 + `revalidatePath` |
| 읽음/삭제 | 개념 없음 | 항목 단위 읽음(`read_at`) + 소프트 삭제(`hidden_by_*`) |
| 화면 형태 | 채팅 버블 | 편지 형태(카드 + 본문 + 원본 인용) |

### 검증

- `npm run typecheck` / `npm run lint` 통과(기존에도 있던 무관한
  react-hooks/incompatible-library 경고 2건 제외).
- `npm run build`(`next build`) 성공, `/dm`·`/dm/[noteId]`·`/dm/compose` 라우트가 정상
  등록됨을 확인.
- `mcp__supabase__get_advisors(security)`로 `dm_notes`/3개 함수 점검 — ERROR 0건. WARN은
  `send_dm_note`/`mark_dm_note_read`/`hide_dm_note`가 `authenticated`에게 RPC로 직접 호출
  가능하다는 것(의도된 설계 — 클라이언트가 실제로 호출해야 하는 함수들이라 기존
  `join_room`/`kick_member`와 동일한 패턴)과, 이 프로젝트의 익명 로그인 활성화로 인한
  `to authenticated` 정책 전체의 기존 경고 패턴뿐이다.
- 원격 DB에서 `dm_conversations` 테이블 부재, `messages.dm_conversation_id` 컬럼 부재,
  `exactly_one_context`가 2-way로 원복된 것을 SQL로 직접 확인한 뒤 착수했다(롤백이 실제로
  적용됐는지 재검증).

### 후속 개선 (2026-08-17, `feature/dm-realtime-badge` 브랜치)

배포 후 실사용 확인 중 발견된 문제 2건.

**① 안읽음 배지 실시간 갱신**

- 착수 전 `select tablename from pg_publication_tables where pubname = 'supabase_realtime'`로
  `dm_notes` 등록 여부를 먼저 확인 — 예상대로 **등록돼 있지 않았다**(`messages`/`rooms`/
  `room_members`/`room_bans`와 동일하게 겪은 함정, §Phase 4). `alter publication
  supabase_realtime add table public.dm_notes`로 해결.
- `lib/realtime/dm-badge.ts`의 `useDmUnreadBadge(initialCount, userId)` — `postgres_changes`
  INSERT를 `recipient_id=eq.{userId}` 필터로 구독(구독 전 `supabase.realtime.setAuth()` 필수,
  RLS가 `auth.uid()`를 참조하므로 anon 기본 연결로는 이벤트 자체를 못 받는다). 이벤트가 오면
  로컬 count를 +1만 한다 — "정확한 값으로 재동기화"는 서버가 다시 계산해 내려주는
  `initialCount`가 바뀔 때(페이지 이동 등으로 레이아웃이 재검증될 때) 담당한다.
- `initialCount` 변경 감지는 `useEffect` + `setState`가 아니라 **렌더 도중 state를 조정하는
  React 공식 패턴**(`if (initialCount !== prevInitialCount) { setPrevInitialCount(...);
  setCount(...) }`)으로 구현했다 — 처음엔 `useEffect(() => setCount(initialCount),
  [initialCount])`로 짰다가 `eslint`(`react-hooks/set-state-in-effect`)가 "effect 안에서
  setState하면 추가 렌더가 발생한다"고 에러를 내서 렌더 중 조정 패턴으로 바꿨다(캐스케이딩
  렌더 한 번을 줄이는 이점도 있음).
- `bottom-nav.tsx`(모바일)와 `sidebar-nav.tsx`(PC)는 반응형 클래스로 화면 크기에 따라
  숨겨질 뿐 **둘 다 항상 DOM에 마운트**돼 있다 — 각자 안에서 훅을 부르면 같은 화면에서
  Realtime 채널이 두 번 열리는 꼴이 된다(§CLAUDE.md "같은 화면에서 여러 하트비트가 겹치지
  않는지 확인할 것"과 동일한 함정). `components/layout/main-nav.tsx`라는 client wrapper를
  새로 만들어 훅을 한 번만 호출하고, 두 네비게이션 컴포넌트에 같은 `unreadDmCount` 값을
  내려주도록 `(main)/layout.tsx`를 수정했다(기존에 레이아웃이 `SidebarNav`/`BottomNav`를
  각각 직접 렌더하던 것을 `MainNav` 하나로 교체).

**② 답장하기 버튼이 보낸 쪽지 상세에도 뜨던 버그**

- `components/dm/dm-note-detail.tsx`가 `note.direction` 구분 없이 답장 UI를 항상 렌더링하고
  있었다. `note.direction === "received"`일 때만 보이도록 수정.
- 클라이언트 UI만 막으면 API를 직접 호출해 우회할 수 있으므로 `send_dm_note()`의
  `p_reply_to_id` 검증도 함께 강화했다 — 기존 `v_uid in (n.sender_id, n.recipient_id)`는
  발신자 본인이 자기가 보낸 쪽지를 `reply_to_id`로 넘겨도 통과시켰다. `n.recipient_id =
  v_uid`(원본 쪽지의 수신자가 호출자 본인)로 좁혀, 답장이 "내가 받은 쪽지에 대한 응답"이라는
  제약을 DB 레벨에서도 강제한다.

마이그레이션: `supabase/migrations/20260818000000_dm_notes_realtime_and_reply_recipient_check.sql`.

**검증**: `npm run typecheck`/`npm run lint`(기존 무관 경고 2건 제외) 통과, `npm run build`
성공, `mcp__supabase__get_advisors(security)` ERROR 0건(WARN은 기존과 동일한 패턴), SQL로
`dm_notes`가 `supabase_realtime` publication에 실제로 등록됐는지 재확인.

---

*— End of DEVELOPMENT_PLAN (Phase 2, 11 상세, 이후 Phase는 착수 시 갱신) —*
