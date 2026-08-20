import Link from "next/link";
import { getCurrentUserClaims } from "@/lib/supabase/auth";
import { getUserProfile } from "@/lib/queries/profile";
import { PostForm } from "@/components/board/post-form";
import { Button } from "@/components/ui/button";

/** 게시글 작성 화면 — 로그인 회원만 작성 가능(§실사용 요청 2026-08-20, 게스트는 profiles가 없어 자동 제외). */
export default async function BoardNewPage() {
  const claims = await getCurrentUserClaims();
  const userId = claims?.sub;
  const profile = userId ? await getUserProfile(userId) : null;

  if (!profile) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-muted-foreground text-sm">글을 작성하려면 로그인이 필요합니다.</p>
        <Link href="/auth/login?redirect=/board/new">
          <Button className="bg-brand-gradient text-brand-foreground rounded-(--radius-card) hover:brightness-105">
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">글쓰기</h1>
      <PostForm />
    </div>
  );
}
