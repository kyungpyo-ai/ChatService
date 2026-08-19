"use client";

import { useState } from "react";
import { Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError } from "@/lib/utils/toast";
import { joinRoomAction } from "@/app/actions/rooms";

interface RoomJoinViewProps {
  roomId: string;
  title: string;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
}

/**
 * 아직 참여하지 않은 로그인 사용자에게 보여주는 "입장하기" 화면 (ROOM-02~04)
 */
export function RoomJoinView({
  roomId,
  title,
  memberCount,
  maxMembers,
  isPrivate,
}: RoomJoinViewProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFull = memberCount >= maxMembers;

  const handleJoin = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("roomId", roomId);
      if (isPrivate) formData.append("password", password);

      const result = await joinRoomAction({ success: false, message: "" }, formData);

      // 성공 시 joinRoomAction 내부의 redirect()가 페이지 이동을 처리한다.
      if (!result.success) {
        showError(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 px-4 py-16 text-center">
      {isPrivate && (
        <div className="bg-brand-muted text-brand mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <Lock size={20} />
        </div>
      )}

      <div className="space-y-1">
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
          <Users size={14} />
          {memberCount}/{maxMembers}명 참여 중
        </p>
      </div>

      {isFull ? (
        <p className="text-destructive text-sm">정원이 가득 찼습니다.</p>
      ) : (
        <>
          {isPrivate && (
            <div className="space-y-1.5 text-left">
              <Label htmlFor="join-password">비밀번호</Label>
              <Input
                id="join-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          )}

          <Button
            className="bg-brand-gradient text-brand-foreground w-full rounded-(--radius-card) hover:brightness-105"
            onClick={handleJoin}
            disabled={isSubmitting || (isPrivate && password.length === 0)}
          >
            {isSubmitting ? "입장하는 중..." : "입장하기"}
          </Button>
        </>
      )}
    </div>
  );
}
