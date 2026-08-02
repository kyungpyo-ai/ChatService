/**
 * 방채팅 관련 데이터베이스 쿼리 함수
 *
 * Server Components에서 사용하는 Supabase 쿼리 모음입니다.
 */

import { createClient } from "@/lib/supabase/server";
import { formatChatTime } from "@/lib/utils/date";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";

export interface RoomListItem {
  id: string;
  title: string;
  ownerNickname: string;
  ownerGender: "male" | "female";
  ownerAge: number;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  createdAt: string;
}

export interface RoomDetail {
  id: string;
  title: string;
  ownerId: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
}

export interface RoomMember {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  isOwner: boolean;
}

// Supabase가 생성하는 타입은 FK 컬럼에 unique 제약이 없으면 forward 임베드도 배열로 추론한다.
// 실제 PostgREST 런타임 응답은 단일 객체이므로(embed 대상 테이블의 FK 컬럼이 조회 테이블에 있음),
// raw row 타입을 명시적으로 선언해 캐스팅한다.
interface RoomListRow {
  id: string;
  title: string;
  max_members: number;
  is_private: boolean;
  created_at: string;
  owner: { username: string | null; gender: string | null; age: number | null } | null;
  room_member_count: number;
}

/**
 * 방 목록 조회 — 방장 프로필(닉네임/성별/나이)과 참여자 수를 함께 조회한다 (ROOM-01, ROOM-08, ROOM-09).
 * 비로그인(게스트) 사용자도 호출 가능 (RLS: rooms select 정책이 anon 허용).
 */
export async function getRoomList(): Promise<RoomListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, title, max_members, is_private, created_at, owner:profiles!rooms_owner_id_fkey(username, gender, age), room_member_count"
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as RoomListRow[])
    .filter((room) => room.owner !== null)
    .map((room) => ({
      id: room.id,
      title: room.title,
      ownerNickname: room.owner!.username ?? "익명",
      ownerGender: (room.owner!.gender ?? "male") as "male" | "female",
      ownerAge: room.owner!.age ?? 0,
      memberCount: room.room_member_count,
      maxMembers: room.max_members,
      isPrivate: room.is_private,
      createdAt: room.created_at,
    }));
}

/**
 * 방 상세 조회 — 방채팅/입장하기 화면 공통으로 사용
 */
export async function getRoomDetail(roomId: string): Promise<RoomDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select("id, title, owner_id, max_members, is_private, room_member_count")
    .eq("id", roomId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    ownerId: data.owner_id,
    memberCount: data.room_member_count,
    maxMembers: data.max_members,
    isPrivate: data.is_private,
  };
}

/**
 * 현재 로그인 사용자가 해당 방의 참여자인지 확인 — 참여자면 방채팅, 아니면 입장하기 화면으로 분기
 */
export async function getMyRoomMembership(roomId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return data !== null;
}

interface RoomMemberRow {
  role: string;
  user: { id: string; username: string | null; avatar_url: string | null } | null;
}

/**
 * 방 참여자 목록 조회 (PC 우측 패널 / 모바일 시트 공용)
 */
export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("room_members")
    .select("role, user:profiles!room_members_user_id_fkey(id, username, avatar_url)")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as unknown as RoomMemberRow[])
    .filter((member) => member.user !== null)
    .map((member) => ({
      id: member.user!.id,
      nickname: member.user!.username ?? "익명",
      avatarUrl: member.user!.avatar_url,
      isOwner: member.role === "owner",
    }));
}

interface RoomMessageRow {
  id: string;
  content: string;
  content_type: string;
  created_at: string;
  sender: { id: string; username: string | null; avatar_url: string | null } | null;
}

/**
 * 방채팅 초기 메시지 목록 조회 (최근 50개) — 이후 실시간 갱신은 lib/realtime/messages.ts의 useRoomMessages가 담당
 */
export async function getRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, content, content_type, created_at, sender:profiles!messages_sender_id_fkey(id, username, avatar_url)"
    )
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return (data as unknown as RoomMessageRow[])
    .filter((message) => message.sender !== null)
    .map((message) => ({
      id: message.id,
      senderId: message.sender!.id,
      senderName: message.sender!.username ?? "익명",
      senderAvatarUrl: message.sender!.avatar_url,
      content: message.content_type === "text" ? message.content : "",
      imageUrl: message.content_type === "image" ? message.content : null,
      createdAt: formatChatTime(message.created_at),
    }));
}
