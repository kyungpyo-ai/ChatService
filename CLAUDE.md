# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**ChatService** — 채팅 서비스 프로젝트입니다. [nextjs-supabase-starter-kit](https://github.com/kyungpyo-ai/nextjs-supabase-starter-kit)을 베이스라인으로 시작했으며, Next.js 15 + Supabase 인증 스캐폴드 위에 채팅 기능을 새로 구현해나가는 단계입니다.

- **이 레포(origin)**: https://github.com/kyungpyo-ai/ChatService
- **베이스 스타터킷(remote: starter-kit)**: https://github.com/kyungpyo-ai/nextjs-supabase-starter-kit
- **Supabase 프로젝트**: `chat-service` (ref: `rhtjdbgjpoucpwkfalxp`, 리전: ap-northeast-2/서울)

> ⚠️ **새 세션(특히 PRD 작성)에서 먼저 읽어야 할 부분**: 아래 "현재 구현된 것" / "아직 구현되지 않은 것"을 확인하고, 이미 있는 인증/프로필 기능을 중복 설계하지 않도록 주의하세요. 채팅 관련 기능(대화방, 메시지, 실시간 등)은 DB 테이블부터 전부 없는 완전한 백지 상태입니다.

## 현재 구현된 것 (스타터킷 베이스라인)

### 인증 (Supabase Auth, 이메일+OAuth 지원 구조)
- `app/auth/login/page.tsx`, `sign-up/page.tsx`, `sign-up-success/page.tsx` — 로그인/회원가입
- `app/auth/forgot-password/page.tsx`, `update-password/page.tsx` — 비밀번호 재설정
- `app/auth/callback/route.ts`, `confirm/route.ts` — OAuth 콜백 / 이메일 확인
- `app/auth/error/page.tsx` — 인증 에러 페이지
- `app/auth/setup-profile/page.tsx` — OAuth 최초 로그인 시 닉네임 설정 (`app/actions/profile.ts`의 `setupProfileAction`)
- `app/actions/auth.ts` — `signOut` 서버 액션
- `app/actions/profile.ts` — 닉네임/프로필 수정, 닉네임 중복 확인 서버 액션
- 관련 폼 컴포넌트: `components/login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx`, `update-password-form.tsx`, `setup-profile-form.tsx`, `social-login-buttons.tsx`, `auth-button.tsx`, `logout-button.tsx`

### 미들웨어 / 라우트 보호
- `middleware.ts` + `lib/supabase/middleware.ts` — 홈(`/`)과 `/auth/*`를 제외한 모든 경로는 비로그인 시 `/auth/login`으로 리다이렉트 (원래 있던 `/admin` 전용 분기는 제거됨)

### DB 스키마 (Supabase, 현재 테이블은 이것 하나뿐)
- `profiles` 테이블 — `id`(auth.users 참조), `email`, `full_name`, `username`(unique), `avatar_url`, `website`, `role`, `created_at`, `updated_at`
- 회원가입 시 `profiles` 행을 자동 생성하는 트리거(`handle_new_user`) + RLS 정책 포함
- 마이그레이션 파일: `supabase/migrations/20260726000000_create_profiles_table.sql`
- 타입: `lib/supabase/database.types.ts` (Supabase에서 자동 생성됨, 테이블 추가 시 `npm run db:types` 재생성 필요)

### 페이지 (그 외)
- `app/page.tsx` — 홈 (아직 스타터킷 플레이스홀더 문구, 채팅 서비스용으로 교체 예정)
- `app/protected/page.tsx` — 스타터킷 원본 튜토리얼 데모 페이지 (실사용 아님, 참고용으로 유지 중)

### 범용 유틸/타입 (채팅 기능에도 재사용 가능)
- `lib/types/models.ts` — `User` 타입 (profiles 기반)
- `lib/types/api.ts`, `components.ts`, `forms.ts`, `utils.ts` — `ApiResponse`, `PaginationParams`, `EmptyStateProps`, `NavItem` 등 범용 타입
- `lib/utils/username.ts`, `date.ts`, `format.ts`, `toast.ts`, `auth-errors.ts`
- `lib/queries/profile.ts`, `lib/schemas/profile.ts` — 프로필 조회/검증
- `components/ui/*` — shadcn/ui 기본 컴포넌트 일체 (button, card, dialog, form, table, select 등)

## 아직 구현되지 않은 것 (PRD/개발 대상)

- 채팅 관련 DB 테이블 전무 (대화방, 메시지, 참여자, 읽음 처리 등 전부 새로 설계 필요)
- 채팅 UI/페이지 전무
- 실시간 기능 (Supabase Realtime 등) 미연동
- 홈 화면이 아직 채팅 서비스 브랜딩으로 교체되지 않음

## 주요 기술 스택

- **프레임워크**: Next.js (최신 버전, App Router)
- **인증/데이터베이스**: Supabase (@supabase/ssr, @supabase/supabase-js)
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui (new-york 스타일, Radix UI 기반)
- **테마**: next-themes (다크 모드 지원)
- **아이콘**: Lucide React
- **타입스크립트**: 엄격 모드 활성화

## 개발 명령어

```bash
# 개발 서버 실행 (Turbopack 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 코드 검사 및 포맷팅
npm run lint           # ESLint 검사
npm run lint:fix       # ESLint 자동 수정
npm run format         # Prettier 포맷팅
npm run format:check   # Prettier 검사만
npm run typecheck      # TypeScript 타입 체크
npm run check-all      # 모든 검사 통합 실행 (권장)
```

## ⚡ 자주 사용하는 명령어

```bash
# 개발
npm run dev         # 개발 서버 실행 (Turbopack)
npm run build       # 프로덕션 빌드
npm run check-all   # 모든 검사 통합 실행 (권장)

# UI 컴포넌트
npx shadcn@latest add button    # 새 컴포넌트 추가
```

## ✅ 작업 완료 체크리스트

```bash
npm run check-all   # 모든 검사 통과 확인
npm run build       # 빌드 성공 확인
```

## 프로젝트 구조 및 아키텍처

### Supabase 클라이언트 패턴

이 프로젝트는 **세 가지 다른 Supabase 클라이언트**를 환경에 따라 사용합니다:

1. **Server Components**: `lib/supabase/server.ts`의 `createClient()`
   - Server Components와 Route Handlers에서 사용
   - 쿠키 기반 인증 처리
   - **중요**: Fluid compute 환경을 위해 함수 내에서 매번 새로 생성해야 함 (전역 변수 사용 금지)

2. **Client Components**: `lib/supabase/client.ts`의 `createClient()`
   - 브라우저 환경의 Client Components에서 사용
   - `createBrowserClient` 사용

3. **Middleware**: `lib/supabase/middleware.ts`의 `updateSession()`
   - Next.js 미들웨어에서 사용
   - 인증되지 않은 사용자를 `/auth/login`으로 리다이렉트
   - **중요**: `createServerClient`와 `supabase.auth.getClaims()` 사이에 코드를 추가하지 말 것

### 인증 흐름

- **미들웨어 보호**: `middleware.ts`는 모든 요청을 가로채서 인증 확인
- **보호된 라우트**: `/protected` 경로는 인증된 사용자만 접근 가능
- **공개 경로**: `/auth/*` (login, sign-up, forgot-password 등)는 미들웨어에서 제외
- **인증 확인 라우트**: `/auth/confirm/route.ts`에서 이메일 확인 처리

### 환경 변수

필수 환경 변수 (`.env.local`):
```
NEXT_PUBLIC_SUPABASE_URL=[Supabase 프로젝트 URL]
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[Supabase Anon Key]
```

**참고**: 환경 변수가 설정되지 않은 경우 미들웨어는 자동으로 건너뜁니다.

### 경로 별칭 설정

`tsconfig.json`에서 `@/*`를 프로젝트 루트로 매핑:
```typescript
// 사용 예시
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
```

### shadcn/ui 컴포넌트

- **스타일**: new-york
- **위치**: `components/ui/`
- **설정**: `components.json`에서 관리
- **추가 방법**: `npx shadcn@latest add [component-name]`

## 코드 작성 가이드라인

### Supabase 클라이언트 사용 시 주의사항

1. **Server Components/Route Handlers**:
   ```typescript
   import { createClient } from "@/lib/supabase/server";

   export default async function ServerComponent() {
     // 매번 새로 생성 (전역 변수 X)
     const supabase = await createClient();
     const { data } = await supabase.from('table').select();
   }
   ```

2. **Client Components**:
   ```typescript
   'use client';
   import { createClient } from "@/lib/supabase/client";

   export default function ClientComponent() {
     const supabase = createClient();
     // ...
   }
   ```

3. **Middleware 수정 시**:
   - `createServerClient`와 `supabase.auth.getClaims()` 사이에 코드를 추가하지 말 것
   - 새로운 Response 객체를 만들 경우 반드시 쿠키를 복사할 것

### TypeScript 타입

- Supabase 데이터베이스 타입은 `lib/supabase/database.types.ts`에 정의됨
- 타입 생성: Supabase CLI를 사용하여 자동 생성 가능

## MCP 서버 설정

프로젝트는 다음 MCP 서버를 사용합니다:
- **supabase**: Supabase 데이터베이스 연동
- **playwright**: 브라우저 자동화
- **context7**: 문서 검색
- **shadcn**: shadcn/ui 컴포넌트 관리

## Git Hooks

프로젝트는 Husky를 사용하여 커밋 전 자동 검증을 수행합니다:
- **pre-commit**: 스테이지된 파일에 대해 ESLint + Prettier 자동 실행
- 커밋 전 자동으로 코드 품질 검사 및 포맷팅 수행

## 추가 참고사항

- **Turbopack**: 개발 서버는 Turbopack을 사용하여 더 빠른 개발 경험 제공
- **폰트**: Geist Sans 폰트를 기본으로 사용
- **다크 모드**: next-themes를 통해 시스템 설정 기반 자동 전환 지원

## 실사용 중 발견한 함정 (배포 후, 2026-08-16)

프로덕션 배포 이후 실사용 버그를 조사하며 확인한, 다시 겪기 쉬운 패턴들. 자세한 배경은
`docs/ROADMAP.md` Phase 9.1 참고.

- **게스트(익명) 세션은 `profiles`가 아니라 `guest_profiles`에 저장된다** — 랜덤채팅이
  `signInAnonymously()`로 발급하는 익명 사용자는 `auth.users`엔 있지만 `profiles`엔 행이
  없다. 로그인 여부를 `Boolean(user)`로만 판단하면 익명 세션이 남은 브라우저가 계속
  "로그인됨"으로 오판된다 — `Boolean(profile)` 또는 `user.is_anonymous`로 판단할 것.
- **"상대가 조용한가" 같은 시간 비교는 클라이언트가 아니라 DB(서버 시각)에서 끝내라** —
  서버가 내려준 timestamptz를 클라이언트의 `Date.now()`와 비교하는 방식은 실사용 중
  즉시 오판하는 버그로 이어졌다(`lib/realtime/random.ts`). DB 함수가 boolean 판단
  결과만 반환하도록 설계할 것.
- **`sendBeacon`/`pagehide`/Presence(`leave`) 같은 "브라우저 종료 즉시 감지" 계열은
  이 앱 실사용 환경에서 신뢰도가 낮다** — 방채팅 자동종료 기능과 랜덤채팅 이탈감지 양쪽
  모두에서 겪음(모바일에서 신호가 아예 유실되거나, Supabase Realtime 내부 하트비트가
  25초라 기대만큼 안 빠름). 이런 신호는 "되면 좋은" 보너스 경로로만 쓰고, 항상 별도의
  주기적 하트비트(폴링)를 최종 안전망으로 둘 것 — 이 신호만 믿고 자동 종료/삭제 같은
  되돌리기 어려운 동작을 트리거하지 말 것.
- **같은 화면에서 여러 하트비트가 겹치지 않는지 확인할 것** — `(chat)/layout.tsx`가
  방채팅 화면에 전역 하트비트와 방 하트비트를 동시에 마운트해 같은 `profiles` 행을
  향해 독립된 60초 타이머 2개가 돌던 적이 있었다. 새 하트비트를 추가할 때는 이미 같은
  화면에서 도는 다른 하트비트가 없는지, 있다면 한 RPC 호출에 묶을 수 있는지 먼저 확인.
- **Vercel 함수 호출량은 랜덤채팅 하트비트가 가장 큰 변수다** — Supabase DB 자체(단일
  row UPDATE)는 부담이 없지만, Hobby 플랜(무료 100만 건/월)은 랜덤채팅이 하루 수백 건만
  돼도 하트비트만으로 소진될 수 있다. 실사용자가 붙기 시작하면 Vercel 대시보드에서 함수
  호출 추이를 확인할 것 — Pro 플랜은 하드 캡이 없고 초과분이 100만 건당 $0.60로 저렴하게
  종량 과금되므로, 하트비트 주기를 더 늘리는 것보다 Pro 전환이 먼저 검토할 선택지다.

💡 **상세 규칙은 위 개발 가이드 문서들을 참조하세요**