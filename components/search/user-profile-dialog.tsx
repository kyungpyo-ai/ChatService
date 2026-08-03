"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SearchUserResult } from "@/lib/queries/users";

interface UserProfileDialogProps {
  user: SearchUserResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GENDER_LABEL: Record<"male" | "female", string> = {
  male: "남성",
  female: "여성",
};

/**
 * 검색 결과 클릭 시 노출되는 프로필 다이얼로그.
 * 검색 결과에 이미 포함된 필드만 사용하므로 추가 쿼리 없이 즉시 표시된다.
 */
export function UserProfileDialog({ user, open, onOpenChange }: UserProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {user && (
          <>
            <DialogHeader className="items-center sm:items-center sm:text-center">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.nickname} />
                  <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "border-background absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2",
                    user.isOnline ? "bg-green-500" : "bg-gray-400"
                  )}
                />
              </div>
              <DialogTitle>{user.nickname}</DialogTitle>
              <DialogDescription>
                {[
                  user.gender ? GENDER_LABEL[user.gender] : null,
                  user.age != null ? `${user.age}세` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "정보 없음"}
              </DialogDescription>
            </DialogHeader>

            <p className="text-muted-foreground text-center text-sm">
              {user.isOnline ? "현재 온라인" : "오프라인"}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
