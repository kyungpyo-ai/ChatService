"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // 이 시점엔 이미 활성 세션이 있는 상태이므로 홈으로 이동한다.
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="bg-surface rounded-(--radius-card) border p-6 shadow-(--shadow-card)">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            비밀번호 재설정
          </h1>
          <p className="text-muted-foreground text-sm">새 비밀번호를 입력해주세요</p>
        </div>
        <form onSubmit={handleForgotPassword}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="password">새 비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="새 비밀번호"
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
              {isLoading ? "저장 중..." : "새 비밀번호 저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
