// TODO(Phase 5): 실제 데이터 연결 후 제거 (방채팅 메시지는 lib/queries/rooms.ts로 대체됨)

import type { ChatMessage } from "@/components/chat/chat-message-bubble";

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
