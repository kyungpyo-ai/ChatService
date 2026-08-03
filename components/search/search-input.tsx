"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 닉네임 검색 인풋 — controlled 컴포넌트, 디바운스는 상위(`UserSearchPanel`)에서 처리
 */
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="닉네임을 입력하세요"
        className="rounded-full pl-9"
      />
    </div>
  );
}
