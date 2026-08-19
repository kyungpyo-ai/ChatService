import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { signOut } from "@/app/actions/auth";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getUserProfile(user.id);

  if (!profile) {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">내 정보</h1>

      <div className="bg-surface rounded-(--radius-card) border p-5 shadow-(--shadow-card)">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username ?? "프로필"} />
            <AvatarFallback>{profile.username?.[0] ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-bold">{profile.username ?? "닉네임 없음"}</p>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>
        </div>
      </div>

      <ProfileEditForm profile={profile} />

      <div className="space-y-2 pt-2">
        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full rounded-(--radius-card)">
            로그아웃
          </Button>
        </form>
        <DeleteAccountButton />
      </div>
    </div>
  );
}
