# 수다온(sudaon) 개발 계획

> 이 문서는 `ROADMAP.md`의 Phase를 실제 파일/컴포넌트/함수 단위 태스크로 분해한 것이다. **바로 착수하는 Phase만 상세히 작성**하고, 이후 Phase는 착수 직전에 이 문서를 갱신해 상세화한다 — 먼 미래 Phase를 지금 촘촘히 계획해봐야 실제 착수 시점에 요구사항/설계가 바뀔 가능성이 크기 때문이다.

- 상세 작성됨: **Phase 2 — UI 뼈대 및 디자인 시스템**
- 개요만 있음: Phase 3~10 (해당 Phase 착수 시 이 문서에 상세 추가)

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

## Phase 3 — 방채팅 (텍스트) — 개요만

`ROADMAP.md` Phase 3 참고. 착수 시 이 섹션에 `rooms`/`room_members`/`messages` 마이그레이션 파일 목록, `join_room()`/`kick_member()` 함수 시그니처, 서버 액션·Realtime 구독 훅 파일 단위 태스크를 상세화한다.

## Phase 4 — 사용자 검색 — 개요만

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
