import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDmConversationDetail, getDmMessages } from "@/lib/queries/dm";
import { DmChatView } from "@/components/dm/dm-chat-view";
import { Button } from "@/components/ui/button";

export default async function DmChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
        <h1 className="text-lg font-bold">쪽지</h1>
        <p className="text-muted-foreground text-sm">쪽지를 보려면 로그인이 필요합니다.</p>
        <Link href="/auth/login">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground rounded-(--radius-card)">
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  // 게스트(익명 세션)나, 대화 참여자가 아닌 사용자는 detail이 null이다(§lib/queries/dm.ts) —
  // 둘 다 404로 처리한다. 대화 존재 여부와 참여 권한을 한 쿼리로 함께 확인한다.
  const detail = await getDmConversationDetail(conversationId, user.id);
  if (!detail) {
    notFound();
  }

  const messages = await getDmMessages(conversationId, user.id, {
    nickname: detail.partnerNickname,
    avatarUrl: detail.partnerAvatarUrl,
  });

  return (
    <DmChatView
      conversationId={detail.id}
      partnerId={detail.partnerId}
      partnerNickname={detail.partnerNickname}
      partnerAvatarUrl={detail.partnerAvatarUrl}
      initialMessages={messages}
      currentUserId={user.id}
    />
  );
}
