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
 * ⚠️ SUPABASE_SERVICE_ROLE_KEY는 이 작업 시점 기준 .env.local에 아직 없다. 서버 전용
 * 비밀값이므로 절대 NEXT_PUBLIC_ 접두사를 쓰지 않고, 값이 없으면 500으로 명확히 실패한다.
 */

import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY(또는 NEXT_PUBLIC_SUPABASE_URL)가 설정되지 않아 정리 작업을 실행할 수 없습니다.",
      },
      { status: 500 }
    );
  }

  // 서비스 롤 키는 RLS를 우회하는 서버 전용 비밀값이라, 쿠키 기반 lib/supabase/server.ts의
  // createClient()가 아니라 이 라우트 안에서 직접 클라이언트를 생성한다(세션 저장/갱신 불필요).
  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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
