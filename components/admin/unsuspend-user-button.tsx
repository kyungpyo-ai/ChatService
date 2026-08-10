"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { showError, showInfo } from "@/lib/utils/toast";
import { unsuspendUserAction } from "@/app/actions/admin";

export function UnsuspendUserButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await unsuspendUserAction(userId);
      if (!result.success) {
        showError(result.message);
        return;
      }
      showInfo(result.message);
      router.refresh();
    });
  };

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      정지 해제
    </Button>
  );
}
