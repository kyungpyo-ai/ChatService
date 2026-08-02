# 수다온(sudaon) 개발 계획

> 이 문서는 `ROADMAP.md`의 Phase를 실제 파일/컴포넌트/함수 단위 태스크로 분해한 것이다. **바로 착수하는 Phase만 상세히 작성**하고, 이후 Phase는 착수 직전에 이 문서를 갱신해 상세화한다 — 먼 미래 Phase를 지금 촘촘히 계획해봐야 실제 착수 시점에 요구사항/설계가 바뀔 가능성이 크기 때문이다.

- 상세 작성됨: **Phase 2 — UI 뼈대 및 디자인 시스템**, **Phase 3 — 방채팅(텍스트)**, **Phase 4 — 방 나가기/온라인 상태(구현 완료분만 상세, 사용자 검색은 개요만)**
- 개요만 있음: Phase 4의 사용자 검색 부분, Phase 5~10 (해당 Phase 착수 시 이 문서에 상세 추가)

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
| `lib/queries/rooms.ts` | 신규 | `getRoomList()`, `getRoomDetail(roomId)`, `getRoomMembers(roomId)`, `getMyRoomMembership(roomId)` — Server Component 전용 읽기 함수, `lib/queries/profile.ts`와 동일하게 `createClient()`(server) 사용 |
| `app/actions/rooms.ts` | 신규 | `createRoomAction`, `joinRoomAction` 서버 액션. `createRoomAction`: 로그인 확인(+ `is_anonymous`면 거부, ROOM-02) → zod 검증 → `isPrivate`면 `bcryptjs.hash()` → `rooms` INSERT(트리거가 owner를 room_members에 자동 등록) → 생성된 방으로 redirect. `joinRoomAction`: 로그인 확인 → `supabase.rpc("join_room", {...})` 호출 → 성공 시 redirect, 실패 사유(정원 초과/비밀번호 오류/강퇴 이력)를 폼 상태로 반환 |
| `app/actions/messages.ts` | 신규 | `sendRoomMessageAction(roomId, content)` — 로그인 확인 → `messages` INSERT(`content_type: "text"`), 권한은 §7 RLS(`room_members` 참여 여부)가 최종 방어선이므로 서버 액션은 얇게 유지 |
| `lib/realtime/messages.ts` | 신규 | `useRoomMessages(roomId, initialMessages)` 클라이언트 훅 — mount 시 `supabase.channel(\`room-${roomId}-messages\`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: \`room_id=eq.${roomId}\` }, ...).subscribe()`, unmount 시 `removeChannel`. RLS가 적용된 상태로 구독되므로 비참여자는 애초에 이벤트를 받지 못함(§ARCHITECTURE 7) |
| `app/(main)/rooms/page.tsx` | 변경 | 정적 컴포넌트 → async Server Component, `mockRooms` 대신 `getRoomList()` |
| `app/(main)/rooms/new/page.tsx` | 변경 | 정적 마크업 폼 → Client Component, `react-hook-form` + `zod` + `createRoomAction` 연결(기존 `setup-profile-form.tsx` 패턴 재사용). 비로그인 접근 시 안내 문구 + 로그인 유도(미들웨어는 `/rooms`를 공개 경로로 유지하므로 로그인 차단은 액션/화면 레벨에서 처리, §ARCHITECTURE 3) |
| `app/(main)/rooms/[roomId]/page.tsx` | 변경 | async Server Component. `getRoomDetail` + `getMyRoomMembership` 조회 → 참여자가 아니면 `RoomJoinView`(입장하기 화면, 비밀번호 입력 포함)를, 참여자면 `RoomChatView`(+ 초기 메시지·참여자 목록)를 렌더링 |
| `components/rooms/room-join-view.tsx` | 신규 | 미참여 사용자용 "입장하기" 화면 — 방 제목/인원 표시, 비공개방이면 비밀번호 입력란, `joinRoomAction` 연결, 게스트는 로그인 유도 문구만 표시(방 목록·미리보기는 ROOM-01에 따라 게스트도 조회 가능) |
| `components/rooms/room-chat-view.tsx` | 변경 | `messages` prop(정적 배열) 대신 `useRoomMessages(roomId, initialMessages)` 사용. `ChatInputBar`에 `onSend` 콜백을 연결해 `sendRoomMessageAction` 호출 |
| `components/chat/chat-input-bar.tsx` | 변경 | 현재 마크업 전용 → `onSend: (text: string) => void` prop 추가, 전송 후 인풋 초기화 |
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

## Phase 4 — 방 나가기 / 온라인 상태 (상세, 구현 완료) + 사용자 검색 (개요만)

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

Realtime Presence는 DB 테이블이 아니라 각 클라이언트가 채널에 접속해있는 동안만 유지되는 인메모리 상태라 별도 마이그레이션이 필요 없다.

### 4.2 신규/변경 파일

| 파일 | 상태 | 설명 |
|---|---|---|
| `app/actions/rooms.ts` | 변경 | `leaveRoomAction(roomId)` 추가. 폼이 아닌 클릭 핸들러에서 직접 호출되므로 `redirect()`는 쓰지 않고 성공 여부(`ActionResult`)만 반환 — 클라이언트에서 `router.push("/rooms")` 처리 |
| `lib/realtime/presence.ts` | 신규 | `useRoomPresence(roomId, userId): Set<string>` — `room-${roomId}-presence` 채널을 구독해 `track()`으로 자신의 접속 상태를 알리고, `presence` `sync` 이벤트로 현재 온라인인 user id 집합을 반환 |
| `lib/realtime/messages.ts` | 재작성 | `useRoomMessages`가 메시지뿐 아니라 참여자 실시간 변동까지 함께 관리하도록 확장(`{ messages, participants }` 반환). **채널당 postgres_changes 바인딩 1개만 등록 가능**하다는 이 프로젝트 Realtime의 제약(§4.2 발견분) 때문에 메시지 채널과 참여자 변동 채널을 분리했고, 참여자 변동은 `event:"*"` 단일 바인딩으로 받아 매번 참여자 목록을 재조회해 이전 상태와 diff하는 방식으로 입장/퇴장을 판단(발신자 id로 payload.old를 신뢰할 수 없어서). 입장/퇴장 시 `isSystemNotice: true`인 `ChatMessage`(기존 타입에 이미 있던 필드)를 채팅 목록에 추가 |
| `components/rooms/leave-room-dialog.tsx` | 신규 | 나가기 확인 다이얼로그. 방장이면 "방이 삭제되고 대화 내용이 사라진다"는 경고 문구로 분기 |
| `components/chat/chat-header.tsx` | 변경 | `onLeave`/`leaveLabel` prop 추가 — 전달되면 "더보기" 아이콘 버튼 대신 "나가기" 텍스트 버튼이 곧바로 노출됨(드롭다운에 숨기지 않음). 랜덤채팅 등 `onLeave`를 안 쓰는 화면은 기존과 동일하게 동작 |
| `components/rooms/participant-list.tsx` | 변경 | `onlineUserIds?: Set<string>` prop 추가 — 참여자 아바타에 온라인 초록 점 표시, PC 사이드패널 헤더에 "참여자 n명 · 온라인 m명" 표시 |
| `components/rooms/room-chat-view.tsx` | 변경 | `useRoomMessages`가 반환하는 실시간 `participants`를 참여자 패널/헤더 정원/방장 판별에 그대로 사용(서버가 내려준 정적 prop 대신). `useRoomPresence` 훅 연결, 나가기 다이얼로그 상태 관리 및 `leaveRoomAction` 호출 후 라우팅 |

### 4.3 완료 조건 및 검증 (완료)

- `npm run check-all`, `npm run build` 통과
- Playwright로 실제 방 생성 → 방장이 "나가기" → 방/멤버십/메시지가 DB에서 모두 삭제(cascade)됨을 SQL로 확인
- Playwright로 브라우저 탭 2개를 같은 방에 띄워 "참여자 n명 · 온라인 m명" 표시 확인 (같은 계정으로 테스트해 실질적으로는 Presence 파이프라인 동작만 검증 — 서로 다른 두 계정 간 온라인 카운트 정합성은 별도 검증 필요)
- 실제 두 번째 프로필(`kyu275`)을 DB에서 직접 입장/퇴장시켜, 새로고침 없이 "OOO님이 입장했습니다"/"나갔습니다" 시스템 메시지와 참여자 수·헤더 정원이 즉시 갱신됨을 확인
- 이 과정에서 Node 스크립트로 Realtime 인프라 제약 3건을 격리 재현·확인함(§ROADMAP Phase 4 "추가 검증" 참고): 채널당 바인딩 1개 제한, `room_members`의 publication 미등록, DELETE old row의 payload 축약

### 4.4 사용자 검색 — 개요만

`ROADMAP.md` Phase 4 참고. 착수 시 `last_seen_at` 하트비트 구현 방식(클라이언트 인터벌 vs 방문 이벤트 기반), 검색 서버 액션/쿼리 파일을 상세화한다.

## Phase 5 — 랜덤채팅 (텍스트) — 개요만

`ROADMAP.md` Phase 5 참고. 착수 시 `match_or_wait()` 함수 본문, 익명 인증 발급 지점, 대기 화면 Realtime 구독 훅을 상세화한다.

## Phase 6 — 이미지 전송 — 개요만

`ROADMAP.md` Phase 6 참고. 착수 시 Storage 버킷/정책 마이그레이션, 업로드 서버 액션, 클라이언트 업로드 컴포넌트를 상세화한다.

## Phase 7 — 권한 검증 및 계정 관리 — 개요만

`ROADMAP.md` Phase 7 참고. 착수 시 강퇴/탈퇴 서버 액션, rate limit 구현 방식(DB 카운터 vs Upstash Redis) 결정 및 상세화한다.

## Phase 8 — UI/UX 마감 및 반응형 — 개요만

`ROADMAP.md` Phase 8 참고.

## Phase 9 — 배포 — 개요만

`ROADMAP.md` Phase 9 참고.

## Phase 10 — 후속 검토 — 범위 외

`ROADMAP.md` Phase 10 참고. MVP 범위 밖이므로 상세화하지 않는다.

---

*— End of DEVELOPMENT_PLAN (Phase 2 상세, 이후 Phase는 착수 시 갱신) —*
