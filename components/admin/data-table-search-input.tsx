"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

/**
 * DataTable의 검색 인풋만 분리한 Client Component. `render` 함수를 포함한 컬럼 정의를
 * 서버 컴포넌트(각 /admin/* 페이지)에서 그대로 내려받아야 하는 DataTable 자체는
 * Client Component가 아니어야 하므로(함수를 Server→Client로 넘길 수 없음), 실제 클라이언트
 * 상호작용(라우팅)이 필요한 검색 인풋만 여기로 뺐다.
 */
export function DataTableSearchInput({ placeholder = "검색" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Input
      defaultValue={searchParams.get("q") ?? ""}
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleSearch((e.target as HTMLInputElement).value);
        }
      }}
      className="max-w-xs"
    />
  );
}
