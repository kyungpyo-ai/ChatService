import { RoomListSearchBar } from "@/components/rooms/room-list-search-bar";
import { RoomListTabs } from "@/components/rooms/room-list-tabs";
import { AdBanner } from "@/components/layout/ad-banner";
import { getRoomList, getMyRoomList } from "@/lib/queries/rooms";
import { createClient } from "@/lib/supabase/server";

export default async function RoomListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [rooms, myRooms] = await Promise.all([
    getRoomList(),
    user ? getMyRoomList(user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">방 목록</h1>

      <RoomListTabs rooms={rooms} myRooms={myRooms} isLoggedIn={!!user} currentUserId={user?.id}>
        <RoomListSearchBar />
      </RoomListTabs>

      <AdBanner />
    </div>
  );
}
