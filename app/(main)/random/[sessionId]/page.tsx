import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRandomSessionForUser, getRandomSessionMessages } from "@/lib/queries/random";
import { RandomChatView } from "@/components/random/random-chat-view";

export default async function RandomChatPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 매칭 없이 URL을 직접 입력해 들어온 경우 — 로그인(익명 포함) 자체가 없으면 매칭부터 다시 시작
  if (!user) {
    redirect("/random");
  }

  const session = await getRandomSessionForUser(sessionId, user.id);

  if (!session) {
    notFound();
  }

  const messages = await getRandomSessionMessages(sessionId, user.id);

  return (
    <RandomChatView
      sessionId={sessionId}
      initialMessages={messages}
      currentUserId={user.id}
      initialEnded={session.status === "ended"}
      initialEndedByMe={session.status === "ended" && session.endedBy === user.id}
    />
  );
}
