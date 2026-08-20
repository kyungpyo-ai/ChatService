/**
 * 오래된 쪽지 정리 배치 — 쪽지는 DM_NOTE_RETENTION_DAYS(7일)만 보관한다(§실사용 요청 2026-08-20).
 *
 * dm_notes는 storage 파일이 딸려있지 않은 순수 행이라 cleanup-chat-images처럼 별도 RPC로
 * 대상 목록을 뽑을 필요 없이, 서비스 롤 클라이언트로 직접 delete한다 — 서비스 롤은
 * `revoke insert, update, delete on public.dm_notes from authenticated`의 적용 대상이
 * 아니라(RLS/GRANT를 완전히 우회) 그대로 지울 수 있다.
 *
 * 인증: CRON_SECRET 환경변수와 Authorization: Bearer 헤더를 비교한다(불일치 시 401,
 * cleanup-chat-images와 동일 패턴).
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DM_NOTE_RETENTION_DAYS } from "@/lib/queries/dm";

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

  const cutoff = new Date(Date.now() - DM_NOTE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: deleted, error } = await supabase
    .from("dm_notes")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: `쪽지 정리에 실패했습니다: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ deletedCount: deleted?.length ?? 0 });
}
