"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChatHeader } from "@/components/chat/chat-header";
import { MatchingIndicator } from "@/components/random/matching-indicator";
import { useRandomMatching } from "@/lib/hooks/use-random-matching";
import { cancelRandomQueueAction } from "@/app/actions/random";
import { showError } from "@/lib/utils/toast";

/**
 * 매칭 대기 화면 — use-random-matching 훅으로 매칭 상태를 관리한다.
 * sessionId가 확보되면 곧바로 해당 세션의 랜덤채팅 화면으로 이동한다.
 */
export function RandomMatchingClient() {
  const router = useRouter();
  const { sessionId, error } = useRandomMatching();
  const shownErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      router.replace(`/random/${sessionId}`);
    }
  }, [sessionId, router]);

  useEffect(() => {
    if (error && shownErrorRef.current !== error) {
      shownErrorRef.current = error;
      showError(error);
    }
  }, [error]);

  const handleCancel = async () => {
    await cancelRandomQueueAction();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <ChatHeader title="랜덤채팅" backHref="/" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4">
        <MatchingIndicator />

        <Button
          variant="outline"
          className="w-full max-w-xs rounded-(--radius-card)"
          onClick={handleCancel}
        >
          매칭 취소
        </Button>

        <p className="text-muted-foreground mt-6 text-xs">TIP. 매너있는 대화는 모두가 즐거워요!</p>
      </div>
    </div>
  );
}
