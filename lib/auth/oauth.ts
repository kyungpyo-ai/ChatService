"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Google OAuth 로그인
 *
 * @param redirectPath - 로그인 성공 후 리다이렉트할 경로 (기본값: '/')
 * @returns Supabase Auth 응답 객체
 */
export async function signInWithGoogle(redirectPath: string = "/") {
  const supabase = createClient();

  // 0.0.0.0은 "모든 인터페이스에서 수신 대기"를 뜻하는 바인드 전용 주소라 브라우저가
  // 실제로 접속 가능한 origin이 아니다. 개발 서버를 0.0.0.0으로 띄워 그 주소로 접속한
  // 경우 window.location.origin이 그대로 http://0.0.0.0:3000이 되어, Supabase의 Redirect
  // URLs 허용 목록(localhost:3000 등)과 불일치해 OAuth 완료 후 엉뚱한 곳으로 빠지는
  // 원인이 된다. localhost로 정규화해 항상 유효한 origin으로 리다이렉트되게 한다.
  const origin = window.location.origin.replace("//0.0.0.0", "//localhost");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${redirectPath}`,
    },
  });

  return { data, error };
}
