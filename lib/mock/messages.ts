// TODO(Phase 3~5): 실제 데이터 연결 후 제거

import type { ChatMessage } from "@/components/chat/chat-message-bubble";

export const mockRoomMessages: ChatMessage[] = [
  {
    id: "sys-1",
    senderId: "system",
    senderName: "시스템",
    content: "서로 존중하며 즐거운 대화를 나누어요 😊",
    createdAt: "",
    isSystemNotice: true,
  },
  {
    id: "m1",
    senderId: "u1",
    senderName: "해피해피",
    content: "안녕하세요! 처음 왔어요",
    createdAt: "오후 8:30",
  },
  {
    id: "m2",
    senderId: "u2",
    senderName: "바다홀아",
    content: "어서오세요~! 반가워요!",
    createdAt: "오후 8:31",
  },
  {
    id: "me1",
    senderId: "me",
    senderName: "나",
    content: "반갑습니다! 잘 부탁드려요 🙌",
    createdAt: "오후 8:31",
  },
  {
    id: "m3",
    senderId: "u3",
    senderName: "영화좋아",
    content: "오늘 날씨 좋네요 ☀️",
    createdAt: "오후 8:32",
  },
  {
    id: "m4",
    senderId: "u4",
    senderName: "커피한잔",
    content: "",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop",
    createdAt: "오후 8:33",
  },
];

export const mockRandomMessages: ChatMessage[] = [
  {
    id: "sys-1",
    senderId: "system",
    senderName: "시스템",
    content: "매칭이 완료되었어요. 인사를 나눠보세요!",
    createdAt: "",
    isSystemNotice: true,
  },
  {
    id: "m1",
    senderId: "stranger",
    senderName: "익명",
    content: "안녕하세요 :)",
    createdAt: "오후 9:01",
  },
  {
    id: "me1",
    senderId: "me",
    senderName: "나",
    content: "안녕하세요! 반가워요",
    createdAt: "오후 9:01",
  },
];
