import { RoomListSearchBar } from "@/components/rooms/room-list-search-bar";
import { RoomListTabs } from "@/components/rooms/room-list-tabs";
import { AdBanner } from "@/components/layout/ad-banner";
import { getRoomList, getMyRoomList } from "@/lib/queries/rooms";
import { getCurrentUserClaims } from "@/lib/supabase/auth";

export default async function RoomListPage() {
  const claims = await getCurrentUserClaims();

  // 방채팅은 게스트(익명 세션) 참여가 막혀 있으므로(§20260804145642) 익명 사용자는
  // 로그인 안 한 것과 동일하게 취급한다 — 그렇지 않으면 랜덤채팅을 써본 브라우저가
  // 방목록에서도 잘못 "로그인됨" 탭을 보게 된다.
  const isMember = Boolean(claims) && claims?.is_anonymous !== true;
  const userId = claims?.sub;

  const [rooms, myRooms] = await Promise.all([
    getRoomList(),
    isMember ? getMyRoomList(userId!) : Promise.resolve([]),
  ]);

  return (
    <div className="animate-page-fade-in mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="text-xl font-bold">방 목록</h1>

      <RoomListTabs
        rooms={rooms}
        myRooms={myRooms}
        isLoggedIn={isMember}
        currentUserId={isMember ? userId : undefined}
      >
        <RoomListSearchBar />
      </RoomListTabs>

      <AdBanner />
    </div>
  );
}
