"use client";

import { signInWithGoogle } from "@/lib/auth/oauth";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import { showError } from "@/lib/utils/toast";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/**
 * 소셜 로그인 버튼 컴포넌트
 * Google OAuth 로그인을 처리합니다.
 */
export function SocialLoginButtons() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 현재 페이지의 redirect 쿼리 파라미터를 OAuth 콜백에 전달
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get("redirect") || "/";
      const { error } = await signInWithGoogle(redirectTo);
      if (error) throw error;
    } catch (error: unknown) {
      const errorMessage = getAuthErrorMessage(error);
      setError(errorMessage);
      showError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
        {isLoading ? "Google 연결 중..." : "Google로 계속하기"}
      </Button>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">또는</span>
        </div>
      </div>
    </div>
  );
}
