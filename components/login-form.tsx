"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/utils/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLoginButtons } from "@/components/social-login-buttons";
import { showSuccess, showError } from "@/lib/utils/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // 로그인 성공
      showSuccess("로그인되었습니다");

      // redirect 쿼리 파라미터가 있으면 해당 경로로, 없으면 홈으로 이동
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get("redirect") || "/";
      router.push(redirectTo);
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error);
      showError(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="bg-surface rounded-(--radius-card) border p-6 shadow-(--shadow-card)">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            로그인
          </h1>
          <p className="text-muted-foreground text-sm">이메일로 로그인하세요</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="flex flex-col gap-6">
            <SocialLoginButtons />
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">비밀번호</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-brand ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              className="bg-brand hover:bg-brand/90 text-brand-foreground w-full rounded-(--radius-card)"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            계정이 없으신가요?{" "}
            <Link href="/auth/sign-up" className="text-brand underline underline-offset-4">
              회원가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
