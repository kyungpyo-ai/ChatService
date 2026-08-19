"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Plus, Smile, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatImagePreview } from "@/components/chat/chat-image-preview";
import { showError } from "@/lib/utils/toast";
import {
  CHAT_IMAGE_ALLOWED_MIME_TYPES,
  CHAT_IMAGE_MAX_SIZE_BYTES,
  isValidChatImageMimeType,
} from "@/lib/storage/chat-images";

interface ChatInputBarProps {
  onSend: (text: string) => void;
  /** 이미지 첨부 전송 — 넘기지 않으면 첨부 버튼 자체가 비활성화된다 */
  onSendImage?: (file: File) => void | Promise<void>;
  disabled?: boolean;
}

/** 버킷 정책과 동일한 MIME 화이트리스트를 그대로 accept 속성에 사용한다(하드코딩 금지) */
const IMAGE_ACCEPT = CHAT_IMAGE_ALLOWED_MIME_TYPES.join(",");

/**
 * 채팅 하단 고정 입력창 — 텍스트 전송 + 이미지 첨부(Phase 6)
 *
 * 이미지를 선택하면 즉시 클라이언트 사전 검증(형식·용량)을 거쳐 미리보기를 보여주고,
 * 실제 전송은 (텍스트와 동일하게) 전송 버튼을 눌러야 시작된다. 이미지가 대기 중일 때는
 * 텍스트 입력을 비우고 이미지 전송을 우선한다 — 한 번에 텍스트+이미지를 함께 보내는
 * 흐름은 이번 Phase 범위 밖이다.
 *
 * disabled가 true면(예: 방이 삭제된 경우) 텍스트/이미지 전송을 모두 막는다.
 */
export function ChatInputBar({ onSend, onSendImage, disabled }: ChatInputBarProps) {
  const [value, setValue] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sendingImage, setSendingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // previewUrl이 바뀌거나(새 파일 선택) 언마운트될 때 이전 blob URL을 해제해 누수를 막는다.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const clearPendingImage = () => {
    setPendingImage(null);
    setPreviewUrl(null);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    // 같은 파일을 연속으로 다시 선택할 수 있도록 즉시 초기화한다.
    e.target.value = "";
    if (!file) return;

    const mimeType = file.type;
    if (!isValidChatImageMimeType(mimeType)) {
      showError("JPG, PNG, WEBP 형식의 이미지만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
      showError("이미지는 5MB 이하만 첨부할 수 있습니다.");
      return;
    }

    setPendingImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    if (pendingImage) {
      if (!onSendImage) return;
      const file = pendingImage;
      clearPendingImage();
      setSendingImage(true);
      try {
        await onSendImage(file);
      } finally {
        setSendingImage(false);
      }
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  const isBusy = Boolean(disabled) || sendingImage;

  return (
    <div className="bg-surface sticky bottom-0 border-t">
      {pendingImage && previewUrl && (
        <ChatImagePreview
          previewUrl={previewUrl}
          fileName={pendingImage.name}
          onCancel={clearPendingImage}
          disabled={sendingImage}
        />
      )}

      <div className="flex items-center gap-2 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
        />

        <Button
          variant="ghost"
          size="icon"
          aria-label="이미지 첨부"
          className="shrink-0"
          onClick={handleAttachClick}
          disabled={isBusy || !onSendImage}
        >
          <Plus size={20} />
        </Button>

        <Input
          placeholder={
            pendingImage ? "이미지를 전송하려면 전송 버튼을 누르세요" : "메시지를 입력하세요"
          }
          className="rounded-full"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isBusy || Boolean(pendingImage)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />

        <Button variant="ghost" size="icon" aria-label="이모지" className="shrink-0" disabled>
          <Smile size={20} />
        </Button>

        <Button
          size="icon"
          className="bg-brand-gradient text-brand-foreground shrink-0 rounded-full hover:brightness-105 md:h-9 md:w-auto md:gap-1.5 md:px-4"
          aria-label="전송"
          onClick={() => void handleSend()}
          disabled={isBusy}
        >
          <Send size={16} />
          <span className="hidden text-sm font-medium md:inline">전송</span>
        </Button>
      </div>
    </div>
  );
}
