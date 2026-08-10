"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatChatTime } from "@/lib/utils/date";
import type { AdminMessageTimelineItem } from "@/lib/queries/admin";

/** 탈퇴한 사용자가 남긴 메시지의 표시용 이름 — 기존 lib/queries/rooms.ts와 동일 문구 */
const DELETED_USER_NAME = "탈퇴한 사용자";

interface AdminImageBubbleProps {
  path: string;
}

/**
 * 이미지 메시지는 /api/admin/chat-image-url?path=...를 호출해 받은 서명 URL로 표시한다
 * (§DEVELOPMENT_PLAN 7.5.4) — 진행 중/아카이브 여부와 무관하게 항상 이 경로 하나만 사용.
 */
function AdminImageBubble({ path }: AdminImageBubbleProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/chat-image-url?path=${encodeURIComponent(path)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { url: string }) => {
        if (!cancelled) setUrl(data.url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (failed) {
    return <p className="text-muted-foreground text-xs">이미지를 불러올 수 없습니다.</p>;
  }

  if (!url) {
    return <div className="bg-surface-muted h-32 w-32 animate-pulse rounded-md" />;
  }

  return (
    <Image
      src={url}
      alt="첨부 이미지"
      width={200}
      height={200}
      className="rounded-md object-cover"
      unoptimized
    />
  );
}

interface MessageTimelineProps {
  messages: AdminMessageTimelineItem[];
  currentUserId?: string;
  senderNameById?: Map<string, string>;
}

/**
 * 방/세션 메시지를 시간순으로 렌더링 — 진행 중/종료됨(아카이브) 데이터 형태 차이를 props로
 * 흡수해 동일한 컴포넌트로 양쪽을 렌더링한다(§DEVELOPMENT_PLAN 7.5.4). 관리자 화면은 전송 UI가
 * 필요 없으므로 기존 ChatMessageBubble을 재사용하지 않고 열람 전용으로 별도 작성했다.
 */
export function MessageTimeline({ messages, senderNameById }: MessageTimelineProps) {
  if (messages.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">메시지가 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const senderName = message.senderId
          ? (senderNameById?.get(message.senderId) ?? message.senderId.slice(0, 8))
          : DELETED_USER_NAME;

        return (
          <div key={message.id} className="bg-surface rounded-md border p-3 text-sm">
            <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">{senderName}</span>
              {/* 서버(Node ICU)와 브라우저의 ko-KR 로케일 포맷 결과가 달라 hydration mismatch가
                  발생할 수 있음 — 시각 표시값 자체는 사용자에게 중요하지 않은 사소한 차이이므로
                  suppressHydrationWarning으로 허용(React 공식 권장 패턴) */}
              <span suppressHydrationWarning>{formatChatTime(message.createdAt)}</span>
            </div>
            {message.contentType === "image" ? (
              <AdminImageBubble path={message.content} />
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
