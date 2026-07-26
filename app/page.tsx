import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold">Next.js + Supabase Starter</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            새 프로젝트를 시작할 준비가 되었습니다
          </p>
        </div>

        <div className="pt-4">
          <Link href="/auth/login" className="block">
            <Button size="lg" className="w-full rounded-xl py-6 text-base font-semibold shadow-lg">
              시작하기
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
