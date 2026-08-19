import { notFound, redirect } from "next/navigation";
import { getCurrentUserClaims } from "@/lib/supabase/auth";
import { getRandomSessionForUser, getRandomSessionMessages } from "@/lib/queries/random";
import { RandomChatView } from "@/components/random/random-chat-view";

export default async function RandomChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const claims = await getCurrentUserClaims();
  const userId = claims?.sub;

  // 매칭 없이 URL을 직접 입력해 들어온 경우 — 로그인(익명 포함) 자체가 없으면 매칭부터 다시 시작
  if (!userId) {
    redirect("/random");
  }

  // 세션 유효성 확인과 메시지 조회는 서로 의존하지 않으므로 병렬로 보낸다 — 세션이
  // 무효하면 아래에서 notFound()로 막고 messages 결과는 그냥 버린다.
  const [session, messages] = await Promise.all([
    getRandomSessionForUser(sessionId, userId),
    getRandomSessionMessages(sessionId, userId),
  ]);

  if (!session) {
    notFound();
  }

  return (
    <RandomChatView
      sessionId={sessionId}
      initialMessages={messages}
      currentUserId={userId}
      initialEnded={session.status === "ended"}
      initialEndedByMe={session.status === "ended" && session.endedBy === userId}
    />
  );
}
