/**
 * 방채팅 관련 데이터베이스 쿼리 함수
 *
 * Server Components에서 사용하는 Supabase 쿼리 모음입니다.
 */

import { createClient } from "@/lib/supabase/server";
import { formatChatTime } from "@/lib/utils/date";
import { getSignedChatImageUrls } from "@/lib/storage/chat-images";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";

export interface RoomListItem {
  id: string;
  title: string;
  ownerId: string;
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
  owner_id: string;
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
      "id, title, owner_id, max_members, is_private, created_at, owner:profiles!rooms_owner_id_fkey(username, gender, age), room_member_count"
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
      ownerId: room.owner_id,
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
 * 내가 참여 중인 방 목록 조회 — room_members에 내가 속한 방만 필터링 (embed-filter 패턴).
 * getRoomList()와 동일한 필드 구성을 재사용하고, 최근 참여 순(방 생성일 desc)으로 정렬한다.
 */
export async function getMyRoomList(userId: string): Promise<RoomListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, title, owner_id, max_members, is_private, created_at, owner:profiles!rooms_owner_id_fkey(username, gender, age), room_member_count, room_members!inner(user_id)"
    )
    .eq("room_members.user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as RoomListRow[])
    .filter((room) => room.owner !== null)
    .map((room) => ({
      id: room.id,
      title: room.title,
      ownerId: room.owner_id,
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
  sender_id: string | null;
  content: string;
  content_type: string;
  created_at: string;
}

/** 탈퇴한 사용자가 남긴 메시지의 표시용 이름 (§ROADMAP Phase 7, sender_id ON DELETE SET NULL) */
const DELETED_USER_NAME = "탈퇴한 사용자";

/**
 * 방채팅 초기 메시지 목록 조회 (최근 50개) — 이후 실시간 갱신은 lib/realtime/messages.ts의 useRoomMessages가 담당
 *
 * 조회 범위는 "내가 입장한 시점 이후"로 제한된다(오픈채팅 방식). 이 필터링은 messages SELECT
 * RLS(`created_at >= room_member_joined_at(room_id)`)가 담당하므로 여기서 별도 조건을 걸지
 * 않는다 — RLS가 limit보다 먼저 적용되어, 입장 이후 메시지 중 최근 50개가 조회된다.
 *
 * messages.sender_id는 게스트도 보낼 수 있는 랜덤채팅과 컬럼을 공유하느라 profiles가 아니라
 * auth.users를 참조하도록 되어 있어(§게스트/실사용자 분리), `profiles!messages_sender_id_fkey`
 * 같은 PostgREST embed 힌트로는 더 이상 조인이 안 된다. 방채팅은 게스트가 못 들어오므로(§
 * guest_cannot_join_room) 보낸 사람은 항상 profiles에 있다고 보고, 메시지와 프로필을 각각
 * 조회해 sender_id 기준으로 직접 합친다.
 */
export async function getRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const supabase = await createClient();

  // "최근 50개"를 가져오려면 최신순(desc)으로 자른 뒤 표시용으로 시간순(asc)으로 되돌려야 한다.
  // asc + limit(50)으로 자르면 방에 메시지가 50개를 넘는 순간 가장 오래된 50개만 보이고
  // 최근 대화가 통째로 사라진다.
  const { data: latestMessages, error } = await supabase
    .from("messages")
    .select("id, sender_id, content, content_type, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !latestMessages) {
    return [];
  }

  const messages = [...latestMessages].reverse();

  const senderIds = [
    ...new Set(messages.map((m) => m.sender_id).filter((id): id is string => id !== null)),
  ];

  const { data: senders } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", senderIds);

  const senderById = new Map((senders ?? []).map((s) => [s.id, s]));

  // 이미지 메시지의 Storage 경로를 모아 서명 URL을 한 번에 배치 발급한다(메시지마다 개별
  // 발급하지 않음, §DEVELOPMENT_PLAN 6.1 (4)). content는 비공개 버킷 경로일 뿐 URL이
  // 아니므로 그대로 <Image src>에 넘기면 깨진 이미지가 뜬다.
  const imagePaths = (messages as RoomMessageRow[])
    .filter((message) => message.content_type === "image")
    .map((message) => message.content);
  const signedUrlByPath = await getSignedChatImageUrls(supabase, imagePaths);

  // sender_id가 null인 메시지는 보낸 사람이 탈퇴한 경우다(§ROADMAP Phase 7, ON DELETE
  // SET NULL) — 메시지 자체는 계속 보이되 "탈퇴한 사용자"로 표시한다. 이전에는 sender를
  // 못 찾으면 메시지 자체를 걸러냈지만, 탈퇴 후에는 항상 못 찾으므로 그러면 대화가 통째로
  // 사라진다.
  return (messages as RoomMessageRow[]).map((message) => {
    const sender = message.sender_id ? senderById.get(message.sender_id) : undefined;
    return {
      id: message.id,
      senderId: message.sender_id ?? "",
      senderName: sender?.username ?? DELETED_USER_NAME,
      senderAvatarUrl: sender?.avatar_url ?? null,
      content: message.content_type === "text" ? message.content : "",
      imageUrl:
        message.content_type === "image" ? (signedUrlByPath.get(message.content) ?? null) : null,
      createdAt: formatChatTime(message.created_at),
    };
  });
}
