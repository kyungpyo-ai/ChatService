/**
 * 고아 채팅 이미지 정리 배치 (Phase 6)
 *
 * public.list_orphaned_chat_images() SECURITY DEFINER 함수로 고아 경로 목록을 뽑아
 * storage.remove()로 실제 파일까지 지운다(§DEVELOPMENT_PLAN 6.1 (5)) — storage.objects
 * row만 지워서는 스토리지 백엔드의 실제 파일이 남으므로 pg_cron만으로는 처리할 수 없고,
 * 이 Route Handler를 별도 스케줄러(Vercel Cron 등)가 호출해야 한다. 실제 스케줄 등록은
 * Phase 9(배포)에서 처리하고, 이번 Phase에서는 엔드포인트와 수동 호출 검증까지만 한다.
 *
 * 인증: CRON_SECRET 환경변수와 Authorization: Bearer 헤더를 비교한다(불일치 시 401).
 * 서비스 롤 키(SUPABASE_SERVICE_ROLE_KEY)로 Supabase 클라이언트를 생성해 RLS를 우회한다 —
 * list_orphaned_chat_images()는 authenticated/anon에게서 EXECUTE 권한을 명시적으로
 * revoke했으므로 서비스 롤이 아니면 애초에 호출할 수 없다.
 *
 * 서비스 롤 클라이언트는 lib/supabase/admin.ts의 createAdminClient()를 공용으로 쓴다
 * (Phase 7에서 계정 탈퇴 액션과 공유하도록 분리됨).
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHAT_IMAGES_BUCKET } from "@/lib/storage/chat-images";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "관리자 클라이언트 생성에 실패했습니다." },
      { status: 500 }
    );
  }

  const { data: orphanedPaths, error: rpcError } = await supabase.rpc("list_orphaned_chat_images");

  if (rpcError) {
    return NextResponse.json(
      { error: `고아 이미지 조회에 실패했습니다: ${rpcError.message}` },
      { status: 500 }
    );
  }

  const paths = orphanedPaths ?? [];

  if (paths.length === 0) {
    return NextResponse.json({ deletedCount: 0, deletedPaths: [] });
  }

  const { data: removed, error: removeError } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .remove(paths);

  if (removeError) {
    return NextResponse.json(
      { error: `이미지 삭제에 실패했습니다: ${removeError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    deletedCount: removed?.length ?? 0,
    deletedPaths: paths,
  });
}
