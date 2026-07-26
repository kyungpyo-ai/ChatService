"use client";

interface RecentSearchChipsProps {
  items: string[];
}

/**
 * 최근 검색어 칩 목록 + 우측 상단 "전체 삭제" 텍스트 버튼
 */
export function RecentSearchChips({ items }: RecentSearchChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium">최근 검색</p>
        <button type="button" className="text-muted-foreground text-xs hover:underline">
          전체 삭제
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="bg-brand-muted text-brand rounded-full px-3 py-1 text-xs font-medium"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
