import { RoomListSearchBar } from "@/components/rooms/room-list-search-bar";
import { RoomCard } from "@/components/rooms/room-card";
import { AdBanner } from "@/components/layout/ad-banner";
import { mockRooms } from "@/lib/mock/rooms";

export default function RoomListPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">방 목록</h1>

      <RoomListSearchBar />

      <div className="space-y-2.5">
        {mockRooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      <AdBanner />
    </div>
  );
}
