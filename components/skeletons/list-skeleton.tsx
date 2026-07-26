import { Skeleton } from "@/components/ui/skeleton";

/**
 * 범용 리스트 스켈레톤 컴포넌트
 *
 * 리스트 형태의 로딩 상태를 표시합니다.
 * count prop으로 표시할 스켈레톤 아이템 개수를 조절할 수 있습니다.
 *
 * @param count - 표시할 스켈레톤 아이템 개수 (기본값: 3)
 * @param className - 추가 CSS 클래스
 */
export function ListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-card flex items-start gap-4 rounded-lg border p-4">
          {/* 아이콘/이미지 영역 */}
          <Skeleton className="h-12 w-12 flex-shrink-0 rounded-md" />

          {/* 콘텐츠 영역 */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
