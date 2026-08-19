import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateRoomForm } from "@/components/rooms/create-room-form";
import { Button } from "@/components/ui/button";

export default async function CreateRoomPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
        <p className="text-muted-foreground text-sm">방을 만들려면 로그인이 필요합니다.</p>
        <Link href="/auth/login">
          <Button className="bg-brand-gradient text-brand-foreground rounded-(--radius-card) hover:brightness-105">
            로그인하러 가기
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-6">
      <h1 className="text-xl font-bold">새 방 만들기</h1>
      <CreateRoomForm />
    </div>
  );
}
