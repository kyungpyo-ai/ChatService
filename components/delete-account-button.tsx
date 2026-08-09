"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { deleteAccountAction } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";
import { showError } from "@/lib/utils/toast";

const CONFIRM_TEXT = "탈퇴합니다";

/**
 * 계정 탈퇴 버튼 + 확인 다이얼로그 (§ROADMAP Phase 7, PRD §4.1 AUTH-02)
 *
 * 되돌릴 수 없는 작업이라 체크박스 수준이 아니라 문구를 직접 입력해야 버튼이 활성화되도록
 * 해 오탈 클릭을 막는다. deleteAccountAction() 성공 시점에 이미 auth.users가 삭제되어
 * 서버 세션은 무효화된 상태이므로, 공용 signOut() 서버 액션(내부에서 auth.signOut() 실패 시
 * throw) 대신 브라우저 클라이언트로 로컬 세션만 직접 정리한다 — 이미 존재하지 않는 사용자를
 * 상대로 한 API 응답 실패에 좌우되지 않기 위함이다.
 */
export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canConfirm = confirmText === CONFIRM_TEXT;

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (!result.success) {
        showError(result.message);
        return;
      }
      await createClient().auth.signOut();
      router.push("/");
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        className="text-destructive hover:text-destructive w-full"
        onClick={() => setOpen(true)}
      >
        계정 탈퇴
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setConfirmText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 탈퇴하시겠어요?</DialogTitle>
            <DialogDescription>
              탈퇴하면 계정과 프로필이 삭제되고 되돌릴 수 없습니다. 계속하려면 아래에{" "}
              <span className="font-semibold">&quot;{CONFIRM_TEXT}&quot;</span>를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_TEXT}
            autoComplete="off"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={!canConfirm || isPending}
              onClick={handleDelete}
            >
              {isPending ? "탈퇴 처리 중..." : "탈퇴하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
