import Link from "next/link";
import { RoomListSearchBar } from "@/components/rooms/room-list-search-bar";
import { RoomCard } from "@/components/rooms/room-card";
import { AdBanner } from "@/components/layout/ad-banner";
import { getRoomList, getMyRoomList } from "@/lib/queries/rooms";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function RoomListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showMine = tab === "mine" && !!user;
  const rooms = showMine ? await getMyRoomList(user!.id) : await getRoomList();

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">방 목록</h1>

      {user && (
        <div className="flex gap-1 border-b">
          <Link
            href="/rooms"
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              !showMine ? "border-brand text-brand" : "text-muted-foreground border-transparent"
            )}
          >
            전체 방
          </Link>
          <Link
            href="/rooms?tab=mine"
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium",
              showMine ? "border-brand text-brand" : "text-muted-foreground border-transparent"
            )}
          >
            내가 참여중인 방
          </Link>
        </div>
      )}

      <RoomListSearchBar />

      <div className="space-y-2.5">
        {rooms.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            {showMine
              ? "아직 참여 중인 방이 없어요."
              : "아직 개설된 방이 없어요. 첫 방을 만들어보세요!"}
          </p>
        ) : (
          rooms.map((room) => <RoomCard key={room.id} room={room} currentUserId={user?.id} />)
        )}
      </div>

      <AdBanner />
    </div>
  );
}
