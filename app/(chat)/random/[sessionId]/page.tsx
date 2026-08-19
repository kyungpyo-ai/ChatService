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

  const session = await getRandomSessionForUser(sessionId, userId);

  if (!session) {
    notFound();
  }

  const messages = await getRandomSessionMessages(sessionId, userId);

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
