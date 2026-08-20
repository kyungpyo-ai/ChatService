import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // 게스트(비로그인)도 접근 가능한 공개 경로 — PRD상 랜덤채팅/방 목록은 로그인 없이 이용 가능.
  // 게시판(/board)도 목록/상세 열람은 게스트 포함 누구나 가능하다(rooms와 동일한 공개
  // 열람 모델, §ROADMAP Phase 12) — 글쓰기(/board/new)만 로그인 필요, 이건 rooms/new와
  // 동일하게 페이지 자체가 비로그인 안내 화면을 보여준다.
  //
  // /api/cron/*은 사용자 세션이 아니라 CRON_SECRET(Authorization 헤더)으로 스스로를 보호하는
  // 배치 전용 경로다. 여기서 걸러주지 않으면 세션이 없는 Vercel Cron 요청이 /auth/login으로
  // 리다이렉트되어 배치가 실행되지 않는다(엔드포인트의 시크릿 검증에 도달조차 못 함).
  const isPublicPath =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/api/cron") ||
    request.nextUrl.pathname.startsWith("/api/build-version") ||
    request.nextUrl.pathname.startsWith("/random") ||
    request.nextUrl.pathname.startsWith("/rooms") ||
    request.nextUrl.pathname.startsWith("/board") ||
    request.nextUrl.pathname.startsWith("/legal");

  if (!isPublicPath && !user) {
    // no user, potentially respond by redirecting the user to the login page
    console.log("no user, redirecting to login page");
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // 원래 요청 경로를 redirect 쿼리 파라미터로 보존
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
