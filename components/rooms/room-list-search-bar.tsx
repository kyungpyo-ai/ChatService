import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * 방 목록 상단 검색창 + 방 만들기 버튼
 */
export function RoomListSearchBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search
          size={16}
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
        />
        <Input placeholder="방 제목 검색" className="rounded-full pl-9" />
      </div>
      <Link href="/rooms/new">
        <Button className="bg-brand-gradient text-brand-foreground gap-1 rounded-full hover:brightness-105">
          <Plus size={16} />
          <span className="hidden sm:inline">새 방 만들기</span>
        </Button>
      </Link>
    </div>
  );
}
