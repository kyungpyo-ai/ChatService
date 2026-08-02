import { RoomListSearchBar } from "@/components/rooms/room-list-search-bar";
import { RoomCard } from "@/components/rooms/room-card";
import { AdBanner } from "@/components/layout/ad-banner";
import { getRoomList } from "@/lib/queries/rooms";

export default async function RoomListPage() {
  const rooms = await getRoomList();

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">방 목록</h1>

      <RoomListSearchBar />

      <div className="space-y-2.5">
        {rooms.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            아직 개설된 방이 없어요. 첫 방을 만들어보세요!
          </p>
        ) : (
          rooms.map((room) => <RoomCard key={room.id} room={room} />)
        )}
      </div>

      <AdBanner />
    </div>
  );
}
