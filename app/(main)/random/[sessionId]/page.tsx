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

      <ChatInputBar />
    </div>
  );
}
