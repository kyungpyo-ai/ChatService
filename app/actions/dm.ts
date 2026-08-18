/**
 * 쪽지함(단발성 쪽지) 관련 Server Actions (§ROADMAP Phase 11 재설계)
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getDmUnreadCount } from "@/lib/queries/dm";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 쪽지 전송(신규 발송 또는 답장) — send_dm_note() SECURITY DEFINER 함수가 로그인/게스트/정지
 * 여부·자기 자신 여부·수신자 존재 여부·답장 대상 참여 여부를 전부 재검증한다.
 *
 * revalidatePath("/", "layout")로 (main) 레이아웃 전체를 재검증하는 이유: 쪽지 전송은
 * 안읽음 배지(bottom-nav/sidebar-nav)에는 영향을 주지 않지만(내가 보낸 쪽지는 내 안읽음
 * 카운트가 아니다), 목록 페이지(/dm)로 돌아갔을 때 방금 보낸 쪽지가 바로 보이도록
 * 캐시를 갱신해야 한다. 배지 자체는 markDmNoteReadAction/hideDmNoteAction에서 갱신된다.
 */
export async function sendDmNoteAction(
  recipientId: string,
  content: string,
  replyToId?: string
): Promise<ActionResult<{ noteId: string }>> {
  const trimmed = content.trim();

  if (!trimmed) {
    return { success: false, message: "쪽지 내용을 입력해주세요." };
  }

  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const withinRateLimit = await checkRateLimit(supabase, "send_message");
    if (!withinRateLimit) {
      return {
        success: false,
        message: "쪽지를 너무 빠르게 보내고 있습니다. 잠시 후 다시 시도해주세요.",
      };
    }

    const { data: noteId, error: rpcError } = await supabase.rpc("send_dm_note", {
      p_recipient_id: recipientId,
      p_content: trimmed,
      p_reply_to_id: replyToId ?? undefined,
    });

    if (rpcError || !noteId) {
      const message = rpcError?.message.includes("cannot_send_to_self")
        ? "자기 자신에게는 쪽지를 보낼 수 없습니다."
        : rpcError?.message.includes("guest_cannot_send_dm")
          ? "게스트는 쪽지를 보낼 수 없습니다. 로그인해주세요."
          : rpcError?.message.includes("recipient_not_found")
            ? "상대를 찾을 수 없습니다."
            : rpcError?.message.includes("user_suspended")
              ? "이용이 정지된 계정입니다."
              : rpcError?.message.includes("reply_target_not_found")
                ? "답장할 원본 쪽지를 찾을 수 없습니다."
                : "쪽지를 보내지 못했습니다.";

      return { success: false, message };
    }

    revalidatePath("/", "layout");
    return { success: true, message: "쪽지를 보냈습니다.", data: { noteId } };
  } catch {
    return { success: false, message: "쪽지 전송 중 오류가 발생했습니다." };
  }
}

/**
 * 쪽지 읽음 처리 — 수신자 본인이 상세 화면을 열람하면 호출된다(§components/dm/dm-note-detail.tsx).
 * revalidatePath("/", "layout")로 네비게이션 안읽음 배지가 즉시 갱신되도록 한다.
 */
export async function markDmNoteReadAction(noteId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { error } = await supabase.rpc("mark_dm_note_read", { p_note_id: noteId });
    if (error) {
      return { success: false, message: "읽음 처리에 실패했습니다." };
    }

    revalidatePath("/", "layout");
    return { success: true, message: "" };
  } catch {
    return { success: false, message: "읽음 처리 중 오류가 발생했습니다." };
  }
}

/**
 * 쪽지 삭제(소프트) — 호출자가 발신자인지 수신자인지에 따라 hide_dm_note()가 자기 쪽 플래그만
 * 갱신한다. 상대방 쪽 사본에는 영향이 없다(방 나가기와 동일한 "나만 안 보이게" 개념).
 */
export async function hideDmNoteAction(noteId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    if (authError || !data?.claims?.sub) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { error } = await supabase.rpc("hide_dm_note", { p_note_id: noteId });
    if (error) {
      return { success: false, message: "삭제에 실패했습니다." };
    }

    revalidatePath("/", "layout");
    return { success: true, message: "" };
  } catch {
    return { success: false, message: "삭제 중 오류가 발생했습니다." };
  }
}

/**
 * 안읽음 개수 재조회 — `useDmUnreadBadge`(§lib/realtime/dm-badge.ts)가 Realtime 구독 하나만
 * 믿지 않고, 탭 포커스 시점/주기적 폴백으로 실제 값을 다시 맞추기 위해 호출한다
 * (§CLAUDE.md "즉시 감지 계열은 신뢰도가 낮다, 항상 별도의 주기적 재검증을 안전망으로 둘 것").
 * 호출자 본인의 카운트만 반환하며, userId는 클라이언트가 아니라 세션에서 직접 확인한다.
 */
export async function getDmUnreadCountAction(): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const count = await getDmUnreadCount(userId);
    return { success: true, message: "", data: count };
  } catch {
    return { success: false, message: "안읽음 개수를 불러오지 못했습니다." };
  }
}
