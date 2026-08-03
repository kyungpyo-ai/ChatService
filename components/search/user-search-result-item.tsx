import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { SearchUserResult } from "@/lib/queries/users";

interface UserSearchResultItemProps {
  user: SearchUserResult;
  onClick: () => void;
}

/**
 * 검색 결과 행 — 아바타, 닉네임, 나이, 온라인 점, chevron
 */
export function UserSearchResultItem({ user, onClick }: UserSearchResultItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-surface-muted flex w-full items-center gap-3 rounded-(--radius-card) px-2 py-2.5 text-left"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.nickname} />
          <AvatarFallback>{user.nickname[0]}</AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "border-surface absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2",
            user.isOnline ? "bg-green-500" : "bg-gray-400"
          )}
        />
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium">{user.nickname}</p>
        <p className="text-muted-foreground text-xs">{user.age != null ? `${user.age}세` : ""}</p>
      </div>

      <ChevronRight size={18} className="text-muted-foreground" />
    </button>
  );
}
