import { Button } from "@/components/ui/button";
import { ChatHeader } from "@/components/chat/chat-header";
import { MatchingIndicator } from "@/components/random/matching-indicator";

export default function RandomMatchingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <ChatHeader title="랜덤채팅" backHref="/" />

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4">
        <MatchingIndicator />

        <Button variant="outline" className="w-full max-w-xs rounded-(--radius-card)">
          매칭 취소
        </Button>

        <p className="text-muted-foreground mt-6 text-xs">TIP. 매너있는 대화는 모두가 즐거워요!</p>
      </div>
    </div>
  );
}
