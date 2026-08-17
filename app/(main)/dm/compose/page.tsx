import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";
import { DmComposeForm } from "@/components/dm/dm-compose-form";
import { Button } from "@/components/ui/button";

export default async function DmComposePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const { to } = await searchParams;
  if (!to) {
    redirect("/dm");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirect=/dm/compose?to=${to}`);
  }

  const profile = await getUserProfile(user.id);
  if (!profile) {
    return (
      <div className="mx-auto max-w-sm space-y-4 px-4 py-16 text-center">
        <h1 className="text-lg font-bold">쪽지</h1>
        <p className="text-muted-foreground text-sm">
          쪽지는 로그인 회원만 이용할 수 있습니다. 로그인해주세요.
        </p>
        <Link href="/auth/login">
          <Button className="bg-brand hover:bg-brand/90 text-brand-foreground rounded-(--radius-card)">
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  if (to === user.id) {
    redirect("/dm");
  }

  const { data: recipient } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", to)
    .maybeSingle();

  if (!recipient || !recipient.username) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">쪽지 보내기</h1>
      <DmComposeForm
        recipientId={recipient.id}
        recipientNickname={recipient.username}
        recipientAvatarUrl={recipient.avatar_url}
      />
    </div>
  );
}
