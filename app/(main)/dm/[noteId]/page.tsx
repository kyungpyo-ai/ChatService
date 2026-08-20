import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserClaims } from "@/lib/supabase/auth";
import { getUserProfile } from "@/lib/queries/profile";
import { getDmNoteDetail } from "@/lib/queries/dm";
import { DmNoteDetailView } from "@/components/dm/dm-note-detail";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DmNoteDetailPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;

  const claims = await getCurrentUserClaims();
  const userId = claims?.sub;

  if (!userId) {
    redirect(`/auth/login?redirect=/dm/${noteId}`);
  }

  // 게스트(익명 세션)는 profiles 행이 없다 — /dm 목록 페이지와 동일한 기준으로 안내한다.
  const profile = await getUserProfile(userId);
  if (!profile) {
    return (
      <div className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
        <h1 className="text-lg font-bold">쪽지</h1>
        <p className="text-muted-foreground text-sm">
          쪽지는 로그인 회원만 이용할 수 있습니다. 로그인해주세요.
        </p>
        <Link href="/auth/login">
          <Button className="bg-brand-gradient text-brand-foreground rounded-(--radius-card) hover:brightness-105">
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  // 참여자가 아니거나(RLS로도 이미 차단됨), 본인이 소프트 삭제해 자기 쪽에서 숨긴 쪽지면 404.
  const note = await getDmNoteDetail(noteId, userId);
  if (!note) {
    notFound();
  }

  return <DmNoteDetailView note={note} />;
}
