import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

/**
 * OAuth 인증 콜백 핸들러
 * Google OAuth 인증 후 리다이렉트되어 인증 코드를 세션으로 교환합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 인증 성공: 사용자 프로필 조회하여 닉네임 확인
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        // 닉네임이 없으면 설정 페이지로 리다이렉트 (next 파라미터 보존)
        if (!profile?.username) {
          const forwardedHost = request.headers.get("x-forwarded-host");
          const isLocalEnv = process.env.NODE_ENV === "development";
          const setupUrl = `/auth/setup-profile?next=${encodeURIComponent(next)}`;

          if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${setupUrl}`);
          } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${setupUrl}`);
          } else {
            return NextResponse.redirect(`${origin}${setupUrl}`);
          }
        }
      }

      // 닉네임이 있으면 원래 페이지로 리다이렉트 (기존 로직)
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      // 인증 실패: 에러 페이지로 리다이렉트
      return NextResponse.redirect(
        `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  // 인증 코드가 없는 경우: 에러 페이지로 리다이렉트
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent("인증 코드가 없습니다")}`
  );
}
