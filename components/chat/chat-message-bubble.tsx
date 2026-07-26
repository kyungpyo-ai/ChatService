import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  isSystemNotice?: boolean;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  variant: "me" | "other";
}

/**
 * 텍스트/이미지 메시지 버블 — 발신자 아바타 + 닉네임 + 시각 포함
 */
export function ChatMessageBubble({ message, variant }: ChatMessageBubbleProps) {
  const isMe = variant === "me";

  if (message.isSystemNotice) {
    return (
      <div className="flex justify-center py-1">
        <span className="bg-surface-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-end gap-2", isMe && "flex-row-reverse")}>
      {!isMe && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.senderAvatarUrl ?? undefined} alt={message.senderName} />
          <AvatarFallback>{message.senderName[0]}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex max-w-[75%] flex-col gap-1", isMe && "items-end")}>
        {!isMe && <p className="text-muted-foreground px-1 text-xs">{message.senderName}</p>}

        <div className={cn("flex items-end gap-1.5", isMe && "flex-row-reverse")}>
          <div
            className={cn(
              "rounded-(--radius-bubble) px-3.5 py-2 text-sm break-words",
              isMe ? "bg-brand text-brand-foreground" : "bg-surface-muted text-foreground"
            )}
          >
            {message.imageUrl ? (
              <div className="relative h-40 w-56 overflow-hidden rounded-(--radius-bubble)">
                <Image
                  src={message.imageUrl}
                  alt="전송된 이미지"
                  fill
                  className="object-cover"
                  sizes="224px"
                />
              </div>
            ) : (
              message.content
            )}
          </div>
          <span className="text-muted-foreground shrink-0 text-[10px]">{message.createdAt}</span>
        </div>
      </div>
    </div>
  );
}
