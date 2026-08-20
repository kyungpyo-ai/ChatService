import type { Metadata } from "next";
import { RoomListSearchBar } from "@/components/rooms/room-list-search-bar";
import { RoomListTabs } from "@/components/rooms/room-list-tabs";
import { AdBanner } from "@/components/layout/ad-banner";
import { getRoomList, getMyRoomList } from "@/lib/queries/rooms";
import { getCurrentUserClaims } from "@/lib/supabase/auth";

export const metadata: Metadata = {
  title: "방채팅 목록 — 무료 채팅방 | 달나루",
  description:
    "마음에 드는 무료 채팅방에 바로 참여해보세요. 원하는 방이 없다면 직접 채팅방을 만들 수도 있어요.",
};

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
      <div className="space-y-1">
        <h1 className="text-xl font-bold">방채팅</h1>
        <p className="text-muted-foreground text-sm">
          마음에 드는 방에 바로 들어가 대화를 나눠보세요. 원하는 방이 없다면 직접 채팅방을 만들어
          사람들을 모을 수도 있어요.
        </p>
      </div>

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
