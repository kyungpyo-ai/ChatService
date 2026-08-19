import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { JwtPayload } from "@supabase/supabase-js";

/**
 * 현재 로그인 사용자의 JWT 클레임을 조회한다 — Server Component 전용.
 *
 * `getUser()`는 매번 Supabase Auth 서버로 네트워크 요청을 보내 검증하지만, `getClaims()`는
 * JWT를 로컬에서 검증해 훨씬 빠르다(미들웨어에서 이미 같은 패턴 사용 중). 여기에 더해
 * React `cache()`로 감싸서, 같은 요청 안에서 layout과 page가 각각 호출해도 실제 검증은
 * 한 번만 일어나게 한다 — 방목록/내정보 진입이 느리다는 실사용 피드백(§2026-08-19)의
 * 원인이 layout.tsx + page.tsx가 각자 `getUser()`를 호출해 인증 검증을 두 번 하던 것이었다.
 */
export const getCurrentUserClaims = cache(async (): Promise<JwtPayload | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
});
