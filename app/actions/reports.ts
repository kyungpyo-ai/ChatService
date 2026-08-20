/**
 * 사용자 신고 접수 Server Action (Phase 7.5 §7.5.4)
 *
 * 게스트(익명 세션)도 랜덤채팅에서는 신고할 수 있어야 하므로 authenticated(익명 세션 포함)
 * 기준으로 허용한다 — join_room()류와 동일하게 익명 세션도 authenticated role이라는 이
 * 프로젝트의 기존 전제를 따른다(§DEVELOPMENT_PLAN 7.5.4).
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types/forms";

export type ReportTargetType = "room" | "random_session" | "message" | "user" | "post" | "comment";
export type ReportReason = "spam" | "abuse" | "illegal" | "other";

export async function createReportAction(
  targetType: ReportTargetType,
  targetId: string,
  reason: ReportReason,
  detail?: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: userId,
      target_type: targetType,
      target_id: targetId,
      reason,
      detail: detail || null,
    });

    if (error) {
      return { success: false, message: "신고 접수에 실패했습니다." };
    }

    return { success: true, message: "신고가 접수되었습니다." };
  } catch {
    return { success: false, message: "신고 접수 중 오류가 발생했습니다." };
  }
}
