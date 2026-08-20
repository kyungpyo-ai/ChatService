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

export interface DmNoteListPage {
  notes: DmNoteListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** 쪽지 보관 기간 — 이보다 오래된 쪽지는 목록/배지 집계에서 제외되고, cron이 실제로 삭제한다
 * (app/api/cron/cleanup-old-dm-notes/route.ts). */
export const DM_NOTE_RETENTION_DAYS = 7;
export const DM_NOTES_PAGE_SIZE = 20;

function dmNoteRetentionCutoffIso(): string {
  return new Date(Date.now() - DM_NOTE_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
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
 * 이 필터링을 SQL 단계로 내려서(OR + AND 조합) DB에서 처리한다 — hidden 필터를 애플리케이션
 * 코드에서 하면 range()로 페이지를 끊을 때 페이지마다 개수가 들쭉날쭉해진다.
 *
 * 보관 기간(DM_NOTE_RETENTION_DAYS)보다 오래된 쪽지는 cron이 실제로 지우기 전이라도 목록에서
 * 미리 제외한다 — 하루 주기 cron이 아직 안 돈 사이의 오래된 쪽지가 잠깐 보이는 걸 막는다.
 */
export async function getDmNoteList(userId: string, page: number = 1): Promise<DmNoteListPage> {
  const supabase = await createClient();

  const from = (page - 1) * DM_NOTES_PAGE_SIZE;
  const to = from + DM_NOTES_PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("dm_notes")
    .select(
      "id, sender_id, recipient_id, content, read_at, hidden_by_sender, hidden_by_recipient, created_at",
      { count: "exact" }
    )
    .or(
      `and(sender_id.eq.${userId},hidden_by_sender.eq.false),and(recipient_id.eq.${userId},hidden_by_recipient.eq.false)`
    )
    .gte("created_at", dmNoteRetentionCutoffIso())
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { notes: [], page, pageSize: DM_NOTES_PAGE_SIZE, totalCount: 0 };
  }

  const rows = data as DmNoteRow[];
  const partnerIds = [
    ...new Set(
      rows.map((note) => (note.sender_id === userId ? note.recipient_id : note.sender_id))
    ),
  ];

  const partnerById = new Map<
    string,
    { id: string; username: string | null; avatar_url: string | null }
  >();
  if (partnerIds.length > 0) {
    const { data: partners } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", partnerIds);
    for (const partner of partners ?? []) {
      partnerById.set(partner.id, partner);
    }
  }

  const notes = rows.map((note) => {
    const isSender = note.sender_id === userId;
    const partnerId = isSender ? note.recipient_id : note.sender_id;
    const partner = partnerById.get(partnerId);
    return {
      id: note.id,
      direction: isSender ? ("sent" as const) : ("received" as const),
      partnerId,
      partnerNickname: partner?.username ?? "알 수 없음",
      partnerAvatarUrl: partner?.avatar_url ?? null,
      contentPreview: note.content,
      isUnread: !isSender && note.read_at === null,
      createdAt: note.created_at,
    };
  });

  return { notes, page, pageSize: DM_NOTES_PAGE_SIZE, totalCount: count ?? 0 };
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
    .eq("hidden_by_recipient", false)
    .gte("created_at", dmNoteRetentionCutoffIso());

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

  // 파트너 조회와 답장 원본 조회는 서로 무관하므로 병렬로 보낸다 — 답장 원본은 발신자
  // 닉네임까지 embed로 한 번에 가져와 예전에 별도 왕복이던 originalSender 조회를 없앤다.
  const [{ data: partner }, { data: original }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url").eq("id", partnerId).maybeSingle(),
    data.reply_to_id
      ? supabase
          .from("dm_notes")
          .select("id, content, sender:profiles!dm_notes_sender_id_fkey(username)")
          .eq("id", data.reply_to_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const replyTo: DmNoteDetail["replyTo"] = original
    ? {
        id: original.id,
        senderNickname:
          (original as unknown as { sender: { username: string | null } | null }).sender
            ?.username ?? "알 수 없음",
        contentPreview: original.content,
      }
    : null;

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
