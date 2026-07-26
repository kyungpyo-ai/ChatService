import { SearchInput } from "@/components/search/search-input";
import { RecentSearchChips } from "@/components/search/recent-search-chips";
import { UserSearchResultItem } from "@/components/search/user-search-result-item";
import { mockRecentSearches, mockSearchUsers } from "@/lib/mock/users";

export default function UserSearchPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <h1 className="text-xl font-bold">사용자 검색</h1>

      <SearchInput />

      <RecentSearchChips items={mockRecentSearches} />

      <div className="space-y-1">
        <p className="text-muted-foreground px-1 text-xs font-medium">검색 결과</p>
        <div className="divide-y">
          {mockSearchUsers.map((user) => (
            <UserSearchResultItem key={user.id} user={user} />
          ))}
        </div>
        <p className="text-muted-foreground px-1 pt-2 text-xs">
          닉네임으로 사용자를 검색할 수 있어요.
        </p>
      </div>
    </div>
  );
}
