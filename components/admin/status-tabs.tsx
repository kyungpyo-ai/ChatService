"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * "진행 중"/"종료됨" 탭 UI — 방채팅/랜덤채팅 통합 화면 공통 사용(§DEVELOPMENT_PLAN 7.5.4).
 * `?status=active|archived` 쿼리로 상태를 관리해 URL 공유·새로고침에도 유지된다.
 */
export function StatusTabs({ current }: { current: "active" | "archived" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", value);
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={current} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="active">진행 중</TabsTrigger>
        <TabsTrigger value="archived">종료됨</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
