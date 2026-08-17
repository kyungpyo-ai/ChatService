"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { SearchInput } from "@/components/search/search-input";
import { RecentSearchChips } from "@/components/search/recent-search-chips";
import { UserSearchResultItem } from "@/components/search/user-search-result-item";
import { UserProfileDialog } from "@/components/search/user-profile-dialog";
import { searchUsersAction } from "@/app/actions/users";
import { startOrGetDmConversationAction } from "@/app/actions/dm";
import { addRecentSearch, clearRecentSearches, getRecentSearches } from "@/lib/utils/recent-search";
import { showError } from "@/lib/utils/toast";
import type { SearchUserResult } from "@/lib/queries/users";

const MIN_QUERY_LENGTH = 2;

/**
 * 사용자 검색 화면 오케스트레이션 컴포넌트.
 * 검색어 state 보유, 300ms 디바운스로 `searchUsersAction` 호출, 로딩/빈 검색어/결과없음
 * 상태를 분기 렌더링한다. `currentUserId`는 검색 쿼리에는 쓰이지 않지만(서버 액션이 자체
 * getClaims()로 로그인 사용자를 다시 확인) 향후 확장을 고려해 prop으로 받아둔다.
 */
export function UserSearchPanel({ currentUserId }: { currentUserId: string }) {
  // 검색 쿼리 자체는 서버 액션(searchUsersAction)이 getClaims()로 로그인 사용자를 다시
  // 확인하므로 currentUserId를 직접 사용하지 않는다. 다만 페이지가 로그인 사용자 id를
  // 확실히 전달하고 있음을 타입으로 보장하기 위해 prop으로 계속 받는다.
  void currentUserId;

  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(null);
  // 대화 시작 중인 상대 id — 여러 곳(목록 아이콘 버튼, 다이얼로그 버튼)에서 동일한 흐름을
  // 공유하므로 로딩 상태도 하나로 관리한다.
  const [startingDmFor, setStartingDmFor] = useState<string | null>(null);

  useEffect(() => {
    // localStorage는 서버에서 읽을 수 없어 마운트 이후 클라이언트에서만 불러올 수 있다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecentSearches(getRecentSearches());
  }, []);

  const runSearch = useDebouncedCallback(async (term: string) => {
    const trimmed = term.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    try {
      const users = await searchUsersAction(trimmed);
      setResults(users);
      setHasSearched(true);
      addRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());
    } catch {
      showError("검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setResults([]);
      setHasSearched(false);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);
      const trimmed = value.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setIsLoading(false);
        setHasSearched(false);
        return;
      }
      setIsLoading(true);
      runSearch(value);
    },
    [runSearch]
  );

  const handleSelectRecent = (term: string) => {
    setQuery(term);
    handleChange(term);
  };

  const handleClearAll = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  /**
   * "쪽지 보내기" — 이미 대화가 있으면 기존 대화로, 없으면 새로 시작해 이동한다
   * (startOrGetDmConversationAction, §ROADMAP Phase 11).
   */
  const handleSendDm = async (targetUserId: string) => {
    setStartingDmFor(targetUserId);
    const result = await startOrGetDmConversationAction(targetUserId);
    setStartingDmFor(null);

    if (!result.success || !result.data) {
      showError(result.message || "대화를 시작하지 못했습니다.");
      return;
    }

    router.push(`/dm/${result.data.conversationId}`);
  };

  const trimmedQuery = query.trim();
  const showEmptyQueryHint = trimmedQuery.length < MIN_QUERY_LENGTH;

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-6">
      <h1 className="text-xl font-bold">사용자 검색</h1>

      <SearchInput value={query} onChange={handleChange} />

      <RecentSearchChips
        items={recentSearches}
        onSelect={handleSelectRecent}
        onClearAll={handleClearAll}
      />

      <div className="space-y-1">
        <p className="text-muted-foreground px-1 text-xs font-medium">검색 결과</p>

        {showEmptyQueryHint && (
          <p className="text-muted-foreground px-1 pt-2 text-xs">
            닉네임을 2자 이상 입력하면 사용자를 검색할 수 있어요.
          </p>
        )}

        {!showEmptyQueryHint && isLoading && (
          <p className="text-muted-foreground px-1 pt-2 text-xs">검색 중...</p>
        )}

        {!showEmptyQueryHint && !isLoading && hasSearched && results.length === 0 && (
          <p className="text-muted-foreground px-1 pt-2 text-xs">검색 결과가 없어요.</p>
        )}

        {!isLoading && results.length > 0 && (
          <div className="divide-y">
            {results.map((user) => (
              <UserSearchResultItem
                key={user.id}
                user={user}
                onClick={() => setSelectedUser(user)}
                onSendDm={() => void handleSendDm(user.id)}
              />
            ))}
          </div>
        )}
      </div>

      <UserProfileDialog
        user={selectedUser}
        open={selectedUser !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
        onSendDm={() => selectedUser && void handleSendDm(selectedUser.id)}
        sendingDm={selectedUser !== null && startingDmFor === selectedUser.id}
      />
    </div>
  );
}
