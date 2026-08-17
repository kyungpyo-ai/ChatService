/**
 * 쪽지함(단발성 쪽지) 관련 데이터베이스 쿼리 함수 (§ROADMAP Phase 11 재설계)
 *
 * "대화"라는 그룹 개념이 없다 — 쪽지 한 통(dm_notes 행)이 각각 독립된 항목이며, 답장은
 * reply_to_id로 원본을 참조만 할 뿐 새 행으로 따로 존재한다.
 */

import { createClient } from "@/lib/supabase/server";

export interface DmNoteListItem {
  id: string;
  direction: "received" | "sent";
  partnerId: string;
  partnerNickname: string;
  partnerAvatarUrl: string | null;
  contentPreview: string;
  /** 받은 쪽지이면서 아직 읽지 않은 경우에만 true — 보낸 쪽지는 항상 false */
  isUnread: boolean;
  createdAt: string;
}

interface DmNoteRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  hidden_by_sender: boolean;
  hidden_by_recipient: boolean;
  created_at: string;
}

/**
 * 로그인 사용자가 보내거나 받은 쪽지를 하나의 목록으로 합쳐 최신순으로 반환한다(받은함/보낸함
 * 탭 분리 없음 — 방향은 화면에서 아이콘으로만 구분). 소프트 삭제(hidden_by_*)된 쪽지는 삭제한
 * 본인 쪽에서만 제외한다 — RLS는 참여자 전체에게 행을 계속 보여주므로, "나만 안 보이게"는
 * 이 필터링에서 처리한다.
 */
export async function getDmNoteList(userId: string): Promise<DmNoteListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dm_notes")
    .select(
      "id, sender_id, recipient_id, content, read_at, hidden_by_sender, hidden_by_recipient, created_at"
    )
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const visibleRows = (data as DmNoteRow[]).filter((note) => {
    const isSender = note.sender_id === userId;
    return isSender ? !note.hidden_by_sender : !note.hidden_by_recipient;
  });

  const partnerIds = [
    ...new Set(
      visibleRows.map((note) => (note.sender_id === userId ? note.recipient_id : note.sender_id))
    ),
  ];

  const { data: partners } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", partnerIds);
  const partnerById = new Map((partners ?? []).map((p) => [p.id, p]));

  return visibleRows.map((note) => {
    const isSender = note.sender_id === userId;
    const partnerId = isSender ? note.recipient_id : note.sender_id;
    const partner = partnerById.get(partnerId);
    return {
      id: note.id,
      direction: isSender ? "sent" : "received",
      partnerId,
      partnerNickname: partner?.username ?? "알 수 없음",
      partnerAvatarUrl: partner?.avatar_url ?? null,
      contentPreview: note.content,
      isUnread: !isSender && note.read_at === null,
      createdAt: note.created_at,
    };
  });
}

/**
 * 네비게이션 "쪽지" 탭 배지용 안읽음 개수. RLS(참여자 본인만 조회)가 이미 recipient_id로
 * 제한하므로 별도 SECURITY DEFINER 함수 없이 일반 select로 충분하다.
 */
export async function getDmUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("dm_notes")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .is("read_at", null)
    .eq("hidden_by_recipient", false);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export interface DmNoteDetail {
  id: string;
  direction: "received" | "sent";
  partnerId: string;
  partnerNickname: string;
  partnerAvatarUrl: string | null;
  content: string;
  createdAt: string;
  replyTo: { id: string; senderNickname: string; contentPreview: string } | null;
}

/**
 * 쪽지 상세 조회 — 참여자(발신 또는 수신) 본인이 아니면 null, 본인이라도 소프트 삭제로
 * 자기 쪽에서 숨긴 쪽지면 목록에서 이미 안 보이므로 상세도 찾을 수 없는 것으로 취급한다.
 */
export async function getDmNoteDetail(
  noteId: string,
  viewerId: string
): Promise<DmNoteDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dm_notes")
    .select(
      "id, sender_id, recipient_id, content, reply_to_id, created_at, hidden_by_sender, hidden_by_recipient"
    )
    .eq("id", noteId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.sender_id !== viewerId && data.recipient_id !== viewerId) {
    return null;
  }

  const isSender = data.sender_id === viewerId;
  if (isSender ? data.hidden_by_sender : data.hidden_by_recipient) {
    return null;
  }

  const partnerId = isSender ? data.recipient_id : data.sender_id;
  const { data: partner } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", partnerId)
    .maybeSingle();

  let replyTo: DmNoteDetail["replyTo"] = null;
  if (data.reply_to_id) {
    const { data: original } = await supabase
      .from("dm_notes")
      .select("id, sender_id, content")
      .eq("id", data.reply_to_id)
      .maybeSingle();

    if (original) {
      const { data: originalSender } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", original.sender_id)
        .maybeSingle();

      replyTo = {
        id: original.id,
        senderNickname: originalSender?.username ?? "알 수 없음",
        contentPreview: original.content,
      };
    }
  }

  return {
    id: data.id,
    direction: isSender ? "sent" : "received",
    partnerId,
    partnerNickname: partner?.username ?? "알 수 없음",
    partnerAvatarUrl: partner?.avatar_url ?? null,
    content: data.content,
    createdAt: data.created_at,
    replyTo,
  };
}
