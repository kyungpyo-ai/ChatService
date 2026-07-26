import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * 닉네임 검색 인풋
 */
export function SearchInput() {
  return (
    <div className="relative">
      <Search
        size={16}
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      />
      <Input placeholder="닉네임을 입력하세요" className="rounded-full pl-9" />
    </div>
  );
}
