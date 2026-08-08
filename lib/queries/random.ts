/**
 * 랜덤채팅 관련 데이터베이스 쿼리 함수
 *
 * Server Components에서 사용하는 Supabase 쿼리 모음입니다.
 */

import { createClient } from "@/lib/supabase/server";
import { formatChatTime } from "@/lib/utils/date";
import { getSignedChatImageUrls } from "@/lib/storage/chat-images";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";

export interface RandomSessionDetail {
  id: string;
  status: "active" | "ended";
  endedBy: string | null;
}

/**
 * 랜덤채팅 세션 조회 — 본인이 참여자인 세션만 조회한다(§DEVELOPMENT_PLAN 5.4).
 * `random_sessions` SELECT RLS가 참여자 여부를 이미 검증하므로, 비참여자가 조회하면
 * 애초에 행이 반환되지 않는다 — "존재하지 않는 세션"과 "비참여자"를 구분하지 않고 null로 통일한다.
 */
export async function getRandomSessionForUser(
  sessionId: string,
  userId: string
): Promise<RandomSessionDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("random_sessions")
    .select("id, status, ended_by, user_a_id, user_b_id")
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.user_a_id !== userId && data.user_b_id !== userId) {
    return null;
  }

  return {
    id: data.id,
    status: data.status as "active" | "ended",
    endedBy: data.ended_by,
  };
}

interface RandomMessageRow {
  id: string;
  sender_id: string;
  content: string;
  content_type: string;
  created_at: string;
}

/**
 * 랜덤채팅 초기 메시지 목록 조회 (최근 50개) — 이후 실시간 갱신은 lib/realtime/random.ts의
 * useRandomSessionMessages가 담당한다.
 *
 * 랜덤채팅은 신원을 드러내지 않는 것이 설계 의도이므로(§5.0) 발신자 닉네임/아바타는 조회하지
 * 않고, 본인 여부만으로 senderName을 "나"/"상대방" 고정 문자열로 채운다(§5.5).
 */
export async function getRandomSessionMessages(
  sessionId: string,
  currentUserId: string
): Promise<ChatMessage[]> {
  const supabase = await createClient();

  // "최근 50개"를 가져오려면 최신순(desc)으로 자른 뒤 표시용으로 시간순(asc)으로 되돌려야 한다.
  // asc + limit(50)으로 자르면 대화가 50개를 넘는 순간 가장 오래된 50개만 보인다.
  const { data: latest, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, content_type, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !latest) {
    return [];
  }

  const data = [...latest].reverse();

  // 이미지 메시지 경로를 모아 서명 URL을 한 번에 배치 발급 (§DEVELOPMENT_PLAN 6.1 (4)).
  const imagePaths = (data as RandomMessageRow[])
    .filter((message) => message.content_type === "image")
    .map((message) => message.content);
  const signedUrlByPath = await getSignedChatImageUrls(supabase, imagePaths);

  return (data as RandomMessageRow[]).map((message) => ({
    id: message.id,
    senderId: message.sender_id,
    senderName: message.sender_id === currentUserId ? "나" : "상대방",
    content: message.content_type === "text" ? message.content : "",
    imageUrl:
      message.content_type === "image" ? (signedUrlByPath.get(message.content) ?? null) : null,
    createdAt: formatChatTime(message.created_at),
  }));
}
