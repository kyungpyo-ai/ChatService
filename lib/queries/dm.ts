/**
 * 쪽지(DM) 관련 데이터베이스 쿼리 함수
 *
 * Server Components에서 사용하는 Supabase 쿼리 모음입니다. (§ROADMAP Phase 11)
 */

import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";

/** 메시지 목록을 한 번에 가져오는 페이지 크기 — 방채팅(lib/queries/rooms.ts)과 동일한 값 */
export const DM_MESSAGES_PAGE_SIZE = 50;

export interface DmConversationListItem {
  id: string;
  partnerId: string;
  partnerNickname: string;
  partnerAvatarUrl: string | null;
  /** 1차 버전은 텍스트만 지원하므로 항상 메시지 본문 그대로다(이미지 지원 확장 시 손봐야 함) */
  lastMessagePreview: string | null;
  lastMessageAt: string;
}

export interface DmConversationDetail {
  id: string;
  partnerId: string;
  partnerNickname: string;
  partnerAvatarUrl: string | null;
}

interface DmConversationRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  last_message_at: string;
}

/**
 * 로그인 사용자가 참여자인 DM 대화 목록 — 최근 메시지 시각순 정렬(§ROADMAP Phase 11, 안 읽음
 * 표시는 1차 버전 범위 제외). dm_conversations SELECT RLS(참여자 본인만)가 최종 방어선이지만,
 * or() 조건으로도 명시적으로 필터링한다.
 */
export async function getDmConversationList(userId: string): Promise<DmConversationListItem[]> {
  const supabase = await createClient();

  const { data: conversations, error } = await supabase
    .from("dm_conversations")
    .select("id, user_a_id, user_b_id, last_message_at")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("last_message_at", { ascending: false });

  if (error || !conversations || conversations.length === 0) {
    return [];
  }

  const rows = conversations as DmConversationRow[];
  const partnerIds = [
    ...new Set(rows.map((c) => (c.user_a_id === userId ? c.user_b_id : c.user_a_id))),
  ];
  const conversationIds = rows.map((c) => c.id);

  // 목록 미리보기용 "가장 최근 메시지"를 대화별로 하나씩 뽑는다. PostgREST는 DISTINCT ON을
  // 지원하지 않아, 전체를 최신순으로 가져와 대화별 첫 번째 항목만 취하는 방식으로 처리한다
  // (대화당 메시지가 아주 많아지면 비효율적일 수 있으나, 이 서비스 규모에서는 충분하다).
  const [{ data: partners }, { data: latestMessages }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url").in("id", partnerIds),
    supabase
      .from("messages")
      .select("dm_conversation_id, content, content_type, created_at")
      .in("dm_conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  const partnerById = new Map((partners ?? []).map((p) => [p.id, p]));
  const latestByConversation = new Map<string, { content: string; content_type: string }>();
  for (const m of latestMessages ?? []) {
    if (!m.dm_conversation_id || latestByConversation.has(m.dm_conversation_id)) continue;
    latestByConversation.set(m.dm_conversation_id, m);
  }

  return rows.map((c) => {
    const partnerId = c.user_a_id === userId ? c.user_b_id : c.user_a_id;
    const partner = partnerById.get(partnerId);
    const latest = latestByConversation.get(c.id);
    return {
      id: c.id,
      partnerId,
      partnerNickname: partner?.username ?? "알 수 없음",
      partnerAvatarUrl: partner?.avatar_url ?? null,
      lastMessagePreview: latest
        ? latest.content_type === "image"
          ? "사진을 보냈습니다"
          : latest.content
        : null,
      lastMessageAt: c.last_message_at,
    };
  });
}

/**
 * 대화 상세(상대 프로필) 조회 — 로그인 사용자가 그 대화의 참여자가 아니면 null을 반환한다
 * (RLS가 이미 막지만, 참여자가 아닌 경우 채팅 화면으로 갈지 404를 보여줄지 라우팅 분기에
 * 명시적으로 사용한다).
 */
export async function getDmConversationDetail(
  conversationId: string,
  viewerId: string
): Promise<DmConversationDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dm_conversations")
    .select("id, user_a_id, user_b_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.user_a_id !== viewerId && data.user_b_id !== viewerId) {
    return null;
  }

  const partnerId = data.user_a_id === viewerId ? data.user_b_id : data.user_a_id;

  const { data: partner } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", partnerId)
    .maybeSingle();

  return {
    id: data.id,
    partnerId,
    partnerNickname: partner?.username ?? "알 수 없음",
    partnerAvatarUrl: partner?.avatar_url ?? null,
  };
}

interface DmMessageRow {
  id: string;
  sender_id: string | null;
  content: string;
  content_type: string;
  created_at: string;
}

/**
 * DM 메시지 행을 화면 표시용 ChatMessage[]로 변환한다.
 *
 * 방채팅과 달리 "탈퇴한 사용자" 표시 케이스가 없다 — DM은 로그인 회원 전용이고, 계정 탈퇴 시
 * profiles가 cascade 삭제되면 그 사용자가 속한 dm_conversations도 함께 cascade 삭제되어
 * (§dm_conversations.user_a_id/user_b_id on delete cascade) 메시지가 참조하는 대화 자체가
 * 통째로 사라진다. 즉 발신자는 항상 viewer 본인 또는 partner 둘 중 하나로 확정된다.
 */
function mapDmMessageRows(
  rows: DmMessageRow[],
  viewerId: string,
  partner: { nickname: string; avatarUrl: string | null }
): ChatMessage[] {
  return rows.map((row) => {
    const isMe = row.sender_id === viewerId;
    return {
      id: row.id,
      senderId: row.sender_id ?? "",
      senderName: isMe ? "나" : partner.nickname,
      senderAvatarUrl: isMe ? null : partner.avatarUrl,
      content: row.content_type === "text" ? row.content : "",
      createdAt: row.created_at,
    };
  });
}

/**
 * 대화 초기 메시지 목록 조회(최근 50개) — getRoomMessages와 동일하게 최신순으로 잘라 표시용으로
 * 시간순으로 되돌린다.
 */
export async function getDmMessages(
  conversationId: string,
  viewerId: string,
  partner: { nickname: string; avatarUrl: string | null }
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, content_type, created_at")
    .eq("dm_conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(DM_MESSAGES_PAGE_SIZE);

  if (error || !data) {
    return [];
  }

  return mapDmMessageRows([...data].reverse() as DmMessageRow[], viewerId, partner);
}

/**
 * "이전 대화 더 보기" — 대화 참여자 검증(getDmConversationDetail)까지 함께 수행해, 참여자가
 * 아니면 null을 반환한다.
 */
export async function getOlderDmMessagesForViewer(
  conversationId: string,
  beforeCreatedAt: string,
  viewerId: string
): Promise<{ messages: ChatMessage[]; hasMore: boolean } | null> {
  const detail = await getDmConversationDetail(conversationId, viewerId);
  if (!detail) {
    return null;
  }

  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, content_type, created_at")
    .eq("dm_conversation_id", conversationId)
    .lt("created_at", beforeCreatedAt)
    .order("created_at", { ascending: false })
    .limit(DM_MESSAGES_PAGE_SIZE);

  if (error || !rows) {
    return { messages: [], hasMore: false };
  }

  const messages = mapDmMessageRows([...rows].reverse() as DmMessageRow[], viewerId, {
    nickname: detail.partnerNickname,
    avatarUrl: detail.partnerAvatarUrl,
  });

  return { messages, hasMore: rows.length === DM_MESSAGES_PAGE_SIZE };
}
