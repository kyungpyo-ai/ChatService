import Link from "next/link";
import { getCurrentUserClaims } from "@/lib/supabase/auth";
import { getUserProfile } from "@/lib/queries/profile";
import { getDmNoteList } from "@/lib/queries/dm";
import { DmNoteList } from "@/components/dm/dm-note-list";
import { DmPagination } from "@/components/dm/dm-pagination";
import { Button } from "@/components/ui/button";

export default async function DmListPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const claims = await getCurrentUserClaims();
  const userId = claims?.sub;

  // 미들웨어가 /dm(공개 경로 목록 밖)을 비로그인 시 이미 /auth/login으로 보내지만, 게스트
  // (익명 세션)는 user는 있어도 profiles 행이 없다(§guest_profiles 분리) — 쪽지는 로그인
  // 회원 전용이므로 게스트도 같은 화면으로 안내한다(방 목록 페이지의 isMember 판단과 동일 패턴).
  const profile = userId ? await getUserProfile(userId) : null;

  if (!profile) {
    return (
      <div className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
        <h1 className="text-lg font-bold">쪽지</h1>
        <p className="text-muted-foreground text-sm">
          쪽지는 로그인 회원만 이용할 수 있습니다. 로그인해주세요.
        </p>
        <Link href="/auth/login?redirect=/dm">
          <Button className="bg-brand-gradient text-brand-foreground rounded-(--radius-card) hover:brightness-105">
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  const { notes, pageSize, totalCount } = await getDmNoteList(userId!, page);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">쪽지</h1>
        <p className="text-muted-foreground text-xs">최근 7일간 주고받은 쪽지만 보관돼요</p>
      </div>
      <DmNoteList notes={notes} />
      <DmPagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
