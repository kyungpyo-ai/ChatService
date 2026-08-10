/**
 * 관리자 조치 Server Actions (Phase 7.5)
 *
 * 각 액션은 (1) getClaims()로 로그인 확인 (2) is_admin() RPC로 재검증 (3) DB 함수 호출
 * 순서를 따른다 — DB 함수 내부에서도 is_admin()을 다시 검사하지만(§7.5.1), 잘못된 UI 노출
 * 시에도 조기에 거부할 수 있도록 액션 레벨에서도 얇게 재확인한다(§DEVELOPMENT_PLAN 7.5.4).
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  searchAdminMessages,
  getDailyStats,
  type AdminMessageSearchResult,
  type AdminDailyStat,
} from "@/lib/queries/admin";
import type { ActionResult } from "@/lib/types/forms";

async function requireAdmin(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || !isAdmin) {
    return null;
  }

  return { supabase };
}

export async function forceDeleteRoomAction(roomId: string, reason: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, message: "관리자 권한이 필요합니다." };
    }

    const { error } = await admin.supabase.rpc("admin_force_delete_room", {
      p_room_id: roomId,
      p_reason: reason || null,
    });

    if (error) {
      return { success: false, message: "방 강제 삭제에 실패했습니다." };
    }

    revalidatePath("/admin/rooms");
    return { success: true, message: "방이 강제 삭제되었습니다." };
  } catch {
    return { success: false, message: "방 강제 삭제 중 오류가 발생했습니다." };
  }
}

export async function forceEndRandomSessionAction(
  sessionId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, message: "관리자 권한이 필요합니다." };
    }

    const { error } = await admin.supabase.rpc("admin_force_end_random_session", {
      p_session_id: sessionId,
      p_reason: reason || null,
    });

    if (error) {
      return { success: false, message: "세션 강제 종료에 실패했습니다." };
    }

    revalidatePath("/admin/random");
    return { success: true, message: "세션이 강제 종료되었습니다." };
  } catch {
    return { success: false, message: "세션 강제 종료 중 오류가 발생했습니다." };
  }
}

export async function suspendUserAction(
  userId: string,
  reason: string,
  until: string | null
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, message: "관리자 권한이 필요합니다." };
    }

    if (!reason.trim()) {
      return { success: false, message: "정지 사유를 입력해주세요." };
    }

    const { error } = await admin.supabase.rpc("admin_suspend_user", {
      p_user_id: userId,
      p_reason: reason,
      p_until: until,
    });

    if (error) {
      return { success: false, message: "계정 정지에 실패했습니다." };
    }

    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: "계정이 정지되었습니다." };
  } catch {
    return { success: false, message: "계정 정지 중 오류가 발생했습니다." };
  }
}

export async function unsuspendUserAction(userId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, message: "관리자 권한이 필요합니다." };
    }

    const { error } = await admin.supabase.rpc("admin_unsuspend_user", { p_user_id: userId });

    if (error) {
      return { success: false, message: "정지 해제에 실패했습니다." };
    }

    revalidatePath(`/admin/users/${userId}`);
    return { success: true, message: "정지가 해제되었습니다." };
  } catch {
    return { success: false, message: "정지 해제 중 오류가 발생했습니다." };
  }
}

/**
 * 관리자의 계정 강제 탈퇴 — auth.admin.deleteUser는 서비스 롤 API라 SQL 함수로 표현할 수 없다
 * (§DEVELOPMENT_PLAN 7.5.5). app/actions/profile.ts의 deleteAccountAction과 동일한
 * auth.admin.deleteUser 경로를 재사용하되, "본인 확인" 대신 "대상 user_id + 관리자 권한 확인"으로
 * 바꾼 얇은 래퍼다. 감사 로그는 admin_log_action() RPC로 별도 기록한다(DB 함수가 아니므로
 * admin_force_delete_room처럼 함수 내부에서 자동 기록되지 않는다).
 */
export async function forceDeleteAccountAction(
  userId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, message: "관리자 권한이 필요합니다." };
    }

    const adminClient = createAdminClient();
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      return { success: false, message: "계정 강제 탈퇴에 실패했습니다." };
    }

    await admin.supabase.rpc("admin_log_action", {
      p_action: "force_delete_account",
      p_target_type: "user",
      p_target_id: userId,
      p_detail: { reason: reason || null },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "계정이 강제 탈퇴되었습니다." };
  } catch {
    return { success: false, message: "계정 강제 탈퇴 중 오류가 발생했습니다." };
  }
}

export async function resolveReportAction(
  reportId: string,
  actionTaken: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, message: "관리자 권한이 필요합니다." };
    }

    if (!actionTaken.trim()) {
      return { success: false, message: "조치 내용을 입력해주세요." };
    }

    const { error } = await admin.supabase.rpc("admin_resolve_report", {
      p_report_id: reportId,
      p_action_taken: actionTaken,
    });

    if (error) {
      return { success: false, message: "신고 처리에 실패했습니다." };
    }

    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${reportId}`);
    return { success: true, message: "신고가 처리 완료되었습니다." };
  } catch {
    return { success: false, message: "신고 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 메시지 검색 화면(components/admin/message-search-panel.tsx)이 Client Component라
 * lib/queries/admin.ts의 searchAdminMessages()(Server Component 전용 createClient() 사용)를
 * 직접 호출할 수 없다 — 서버 액션으로 얇게 감싸 전달한다. 관리자 권한 재검증은 RPC
 * (admin_search_messages)가 내부에서 is_admin()으로 이미 수행하므로 여기서는 로그인 여부만
 * 얇게 확인한다.
 */
export async function searchAdminMessagesAction(
  query: string,
  dateFrom: string,
  dateTo: string,
  scope: string
): Promise<AdminMessageSearchResult[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  return searchAdminMessages(query, dateFrom, dateTo, scope as never);
}

/**
 * 일자별 지표 조회 화면(components/admin/daily-stats-panel.tsx)이 Client Component라
 * lib/queries/admin.ts의 getDailyStats()를 직접 호출할 수 없어 서버 액션으로 얇게 감싼다 —
 * searchAdminMessagesAction과 동일 패턴.
 */
export async function getDailyStatsAction(
  dateFrom: string,
  dateTo: string
): Promise<AdminDailyStat[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  return getDailyStats(dateFrom, dateTo);
}

export async function dismissReportAction(reportId: string): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return { success: false, message: "관리자 권한이 필요합니다." };
    }

    const { error } = await admin.supabase.rpc("admin_dismiss_report", { p_report_id: reportId });

    if (error) {
      return { success: false, message: "신고 기각에 실패했습니다." };
    }

    revalidatePath("/admin/reports");
    revalidatePath(`/admin/reports/${reportId}`);
    return { success: true, message: "신고가 기각되었습니다." };
  } catch {
    return { success: false, message: "신고 기각 중 오류가 발생했습니다." };
  }
}
