import { MessageSearchPanel } from "@/components/admin/message-search-panel";
import { searchAdminMessagesAction } from "@/app/actions/admin";

/**
 * 통합 메시지 검색 화면(§DEVELOPMENT_PLAN 7.5.6) — 키워드 + 날짜 범위(기본 최근 7일) +
 * 범위 토글(방채팅/랜덤채팅 × 진행중/아카이브/전체).
 */
export default function AdminMessagesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">메시지 검색</h1>
      <MessageSearchPanel searchAction={searchAdminMessagesAction} />
    </div>
  );
}
