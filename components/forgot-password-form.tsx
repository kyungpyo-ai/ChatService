"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // 이메일에 포함될 URL. Supabase 대시보드의 리다이렉트 URL 설정에서 이 URL을 구성해야 합니다.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <div className="bg-surface rounded-(--radius-card) border p-6 shadow-(--shadow-card)">
          <div className="mb-4 space-y-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              이메일을 확인하세요
            </h1>
            <p className="text-muted-foreground text-sm">비밀번호 재설정 안내 발송됨</p>
          </div>
          <p className="text-muted-foreground text-sm">
            이메일과 비밀번호로 가입하셨다면 비밀번호 재설정 이메일을 받으실 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-(--radius-card) border p-6 shadow-(--shadow-card)">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              비밀번호 재설정
            </h1>
            <p className="text-muted-foreground text-sm">
              이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다
            </p>
          </div>
          <form onSubmit={handleForgotPassword}>
            <div className="flex flex-col gap-6">
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
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="bg-brand hover:bg-brand/90 text-brand-foreground w-full rounded-(--radius-card)"
                disabled={isLoading}
              >
                {isLoading ? "전송 중..." : "재설정 이메일 보내기"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              이미 계정이 있으신가요?{" "}
              <Link href="/auth/login" className="text-brand underline underline-offset-4">
                로그인
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
