import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { mockRandomMessages } from "@/lib/mock/messages";

export default async function RandomChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  await params;

  return (
    <div className="flex min-h-screen flex-col">
      <ChatHeader title="익명과의 대화" backHref="/random" />

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {mockRandomMessages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            variant={message.senderId === "me" ? "me" : "other"}
          />
        ))}
      </div>

      {/* TODO(Phase 5): 실제 랜덤채팅 전송 로직 연결 전까지 입력은 UI만 동작 */}
      <ChatInputBar onSend={() => {}} />
    </div>
  );
}
