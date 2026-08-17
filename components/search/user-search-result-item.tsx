import { ChevronRight, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SearchUserResult } from "@/lib/queries/users";

interface UserSearchResultItemProps {
  user: SearchUserResult;
  onClick: () => void;
  /** "쪽지 보내기" 아이콘 버튼 클릭 핸들러 — 프로필 다이얼로그를 거치지 않고 바로 시작할 수 있게 한다 (§ROADMAP Phase 11) */
  onSendDm: () => void;
}

/**
 * 검색 결과 행 — 아바타, 닉네임, 나이, 온라인 점, 쪽지 보내기 버튼, chevron
 */
export function UserSearchResultItem({ user, onClick, onSendDm }: UserSearchResultItemProps) {
  return (
    <div className="hover:bg-surface-muted flex w-full items-center gap-3 rounded-(--radius-card) px-2 py-2.5">
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
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

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{user.nickname}</p>
          <p className="text-muted-foreground text-xs">{user.age != null ? `${user.age}세` : ""}</p>
        </div>
      </button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="쪽지 보내기"
        className="text-muted-foreground shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onSendDm();
        }}
      >
        <Mail size={18} />
      </Button>

      <ChevronRight size={18} className="text-muted-foreground shrink-0" />
    </div>
  );
}
