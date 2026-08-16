import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";

/**
 * (chat) route group 전용 레이아웃 — 방채팅/랜덤채팅 화면 전용
 *
 * RoomChatView/RandomChatView는 h-dvh로 화면 전체를 직접 차지하도록 설계된 컴포넌트라,
 * (main) 레이아웃의 AppHeader(상단바)·BottomNav(하단 고정 네비게이션)와 함께 중첩되면
 * 전체 높이가 실제 화면보다 커져 스크롤이 필요해지고, 고정된 BottomNav가 입력창 위에
 * 겹쳐 탭 입력을 가로채는 문제가 있었다(§실사용 확인, 2026-08-16). 그래서 이 그룹은
 * 헤더/네비게이션 없이 (main)과 동일한 인증·프로필 설정 가드만 유지한다.
 *
 * 전역 하트비트(HeartbeatProvider)는 여기서 마운트하지 않는다(§2026-08-16 정리) — 방채팅은
 * 이미 useRoomHeartbeat(60초)가 room_heartbeat_*와 함께 last_seen_at까지 같이 갱신하도록
 * 합쳐져 있어(heartbeat_room_presence() RPC) 별도 전역 하트비트가 완전히 중복이었다. 랜덤채팅은
 * RandomChatView 안에서 useHeartbeat()를 직접 마운트해 필요한 곳에서만 돈다.
 */
export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getUserProfile(user.id) : null;

  if (user && profile && !profile.username) {
    redirect("/auth/setup-profile");
  }

  return <>{children}</>;
}
