"use client";

import { useState } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { CHAT_IMAGES_BUCKET, getSignedChatImageUrl } from "@/lib/storage/chat-images";
import { formatChatTime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  content: string;
  imageUrl?: string | null;
  /** ISO 8601 원본 타임스탬프 — 표시용 포맷(formatChatTime)은 렌더 시점에 적용한다 */
  createdAt: string;
  isSystemNotice?: boolean;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  variant: "me" | "other";
}

/** 서명 URL에서 원본 Storage 경로를 역추출한다 — 만료(onError) 시 재발급에 사용한다 */
function extractChatImagePath(signedUrl: string): string | null {
  const match = new RegExp(`/object/sign/${CHAT_IMAGES_BUCKET}/([^?]+)`).exec(signedUrl);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * 이미지 버블 본체 — 로딩 스켈레톤, 서명 URL 만료 1회 재발급 폴백, 클릭 시 원본 확대를 담당한다.
 *
 * 낙관적 전송 중인 로컬 미리보기는 blob: URL이라 next/image 최적화 대상이 아니므로
 * unoptimized로 렌더한다(재발급 대상도 아니다 — 실패해도 재시도하지 않는다).
 */
function ChatImageBubbleContent({ imageUrl }: { imageUrl: string }) {
  const [src, setSrc] = useState(imageUrl);
  const [loaded, setLoaded] = useState(false);
  const [retried, setRetried] = useState(false);
  const [broken, setBroken] = useState(false);
  const [open, setOpen] = useState(false);
  const isBlob = src.startsWith("blob:");

  const handleError = async () => {
    // blob URL(전송 중 로컬 미리보기)이거나 이미 한 번 재발급을 시도했다면 더 이상 재시도하지
    // 않는다 — 무한 재시도 루프 방지.
    if (isBlob || retried) {
      setBroken(true);
      return;
    }
    setRetried(true);

    const path = extractChatImagePath(src);
    if (!path) {
      setBroken(true);
      return;
    }

    const supabase = createClient();
    const renewed = await getSignedChatImageUrl(supabase, path);
    if (renewed) {
      setLoaded(false);
      setSrc(renewed);
    } else {
      setBroken(true);
    }
  };

  if (broken) {
    return (
      <div className="bg-surface text-muted-foreground flex h-40 w-56 items-center justify-center rounded-(--radius-bubble) text-xs">
        이미지를 불러올 수 없습니다
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        className="relative block h-40 w-56 cursor-zoom-in overflow-hidden rounded-(--radius-bubble)"
        onClick={() => setOpen(true)}
        aria-label="이미지 원본 크게 보기"
      >
        {!loaded && <div className="bg-surface absolute inset-0 animate-pulse" />}
        <Image
          src={src}
          alt="전송된 이미지"
          fill
          className={cn("object-cover transition-opacity", loaded ? "opacity-100" : "opacity-0")}
          sizes="224px"
          unoptimized={isBlob}
          onLoad={() => setLoaded(true)}
          onError={() => void handleError()}
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl border-none bg-transparent p-2 shadow-none">
          <DialogTitle className="sr-only">전송된 이미지 원본</DialogTitle>
          <div className="relative h-[70vh] w-full">
            <Image
              src={src}
              alt="전송된 이미지 원본"
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized={isBlob}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
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

      <div className={cn("flex max-w-[75%] min-w-0 flex-col gap-1", isMe && "items-end")}>
        {!isMe && <p className="text-muted-foreground px-1 text-xs">{message.senderName}</p>}

        <div
          className={cn("flex max-w-full min-w-0 items-end gap-1.5", isMe && "flex-row-reverse")}
        >
          <div
            className={cn(
              message.imageUrl
                ? "overflow-hidden rounded-(--radius-bubble)"
                : "min-w-0 rounded-(--radius-bubble) px-3.5 py-2 text-sm break-words",
              !message.imageUrl &&
                (isMe ? "bg-brand-muted text-brand" : "bg-surface-muted text-foreground")
            )}
          >
            {message.imageUrl ? (
              <ChatImageBubbleContent imageUrl={message.imageUrl} />
            ) : (
              message.content
            )}
          </div>
          <span className="text-muted-foreground shrink-0 text-[10px]" suppressHydrationWarning>
            {formatChatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
