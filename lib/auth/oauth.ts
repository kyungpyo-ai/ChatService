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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}`,
    },
  });

  return { data, error };
}
