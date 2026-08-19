import { Skeleton } from "@/components/ui/skeleton";

export default function RoomListLoading() {
  return (
    <div className="skeleton-delayed-fade mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-9 w-full" />
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-(--radius-card)" />
        ))}
      </div>
    </div>
  );
}
