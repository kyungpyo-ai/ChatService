/**
 * 관리자 전용 채팅 이미지 서명 URL 발급 (Phase 7.5 §7.5.4)
 *
 * chat-images Storage RLS는 "해당 방/세션의 현재 참여자"에게만 SELECT를 허용하므로, 방이
 * 삭제되거나 세션이 종료되면 관리자 계정으로도 일반 클라이언트로는 조회할 수 없다
 * (§Phase 6에서 확인된 제약, ROADMAP.md Phase 7.5). 이 라우트가 서비스 롤 키로 RLS를 완전히
 * 우회해 서명 URL을 발급하는 유일한 경로이므로, 매 요청마다 반드시 is_admin()을 확인하고
 * 경로 파라미터를 parseChatImagePath()로 검증한 뒤에만 서비스 롤 클라이언트에 넘긴다.
 *
 * 진행 중인 방/세션의 이미지도 이 경로 하나로 통일해서 쓴다(§DEVELOPMENT_PLAN 7.5.4) —
 * 참여자 기준 일반 서명 URL 발급과 별도로 관리자 전용 경로만 유지해, 호출부
 * (components/admin/message-timeline.tsx)가 진행 중/종료 여부를 신경 쓰지 않아도 된다.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CHAT_IMAGES_BUCKET,
  CHAT_IMAGE_SIGNED_URL_TTL_SECONDS,
  parseChatImagePath,
} from "@/lib/storage/chat-images";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path || !parseChatImagePath(path)) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData, error: authError } = await supabase.auth.getClaims();

  if (authError || !claimsData?.claims?.sub) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();
  const { data: signed, error: signError } = await adminClient.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrl(path, CHAT_IMAGE_SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    return NextResponse.json({ error: "sign_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
