"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChatHeader } from "@/components/chat/chat-header";
import { MatchingIndicator } from "@/components/random/matching-indicator";
import { useRandomMatching } from "@/lib/hooks/use-random-matching";
import { useSingleTabLock } from "@/lib/hooks/use-single-tab-lock";
import { cancelRandomQueueAction } from "@/app/actions/random";
import { showError } from "@/lib/utils/toast";

/** 대기 화면 탭 잠금 전용 key — 세션 ID가 아직 없으므로 채팅방 잠금과 겹치지 않는 고정 문자열을 쓴다. */
const MATCHING_LOCK_KEY = "random-matching-queue";

/**
 * 매칭 대기 화면 진입점 — 같은 브라우저의 다른 탭이 이미 대기 중이면(탭 복제, 링크를 새
 * 탭으로 열기 등) 매칭 큐에 중복으로 들어가지 않도록 안내 화면만 보여준다(§실사용 요청,
 * 2026-08-16). 세부 동작은 채팅방 탭 잠금(RandomChatView)과 동일하다.
 */
export function RandomMatchingClient() {
  const isLeader = useSingleTabLock(MATCHING_LOCK_KEY);

  if (isLeader === null) {
    // 탭 잠금 판정(Web Locks API) 대기 중에도 빈 화면 대신 헤더 + 매칭 인디케이터를 바로
    // 보여줘 클릭이 즉시 반응한 것처럼 느껴지게 한다(§실사용 피드백).
    return (
      <div className="flex h-dvh flex-col">
        <ChatHeader title="랜덤채팅" backHref="/" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4">
          <MatchingIndicator />
        </div>
      </div>
    );
  }

  if (!isLeader) {
    return <RandomMatchingBlockedView />;
  }

  return <RandomMatchingClientActive />;
}

function RandomMatchingBlockedView() {
  return (
    <div className="flex h-dvh flex-col">
      <ChatHeader title="랜덤채팅" backHref="/" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-semibold">다른 탭에서 이미 대기 중입니다</p>
        <p className="text-muted-foreground text-sm">
          이 탭을 닫거나 다른 탭에서 매칭을 취소하면 여기서 이어서 매칭을 시작할 수 있어요.
        </p>
      </div>
    </div>
  );
}

function RandomMatchingClientActive() {
  const router = useRouter();
  const { sessionId, error } = useRandomMatching();
  const shownErrorRef = useRef<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancel = () => {
    if (isCancelling) return;
    // 취소 RPC 응답을 기다리지 않고 즉시 화면을 전환한다 — 클릭 반응이 네트워크 왕복(서울
    // 리전이어도 수백ms)만큼 늦어 보이던 문제(§실사용 피드백). 언마운트 시 useRandomMatching의
    // 클린업이 동일한 cancelRandomQueueAction을 베스트에포트로 다시 호출하므로(멱등), 여기서
    // 결과를 기다리지 않고 fire-and-forget으로 던져도 대기열 정리는 보장된다.
    setIsCancelling(true);
    void cancelRandomQueueAction();
    router.push("/");
  };

  return (
    <div className="flex h-dvh flex-col">
      <ChatHeader title="랜덤채팅" backHref="/" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4">
        <MatchingIndicator />

        <Button
          variant="outline"
          className="w-full max-w-xs rounded-(--radius-card)"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? "취소하는 중..." : "매칭 취소"}
        </Button>

        <p className="text-muted-foreground mt-6 text-xs">TIP. 매너있는 대화는 모두가 즐거워요!</p>
      </div>
    </div>
  );
}
