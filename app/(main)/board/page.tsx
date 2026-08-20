import { PenLine } from "lucide-react";
import { TransitionLink } from "@/components/ui/transition-link";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/board/post-card";
import { BoardPagination } from "@/components/board/board-pagination";
import { getPostList, type PostTag } from "@/lib/queries/board";
import { cn } from "@/lib/utils";

const TAG_TABS: { value: PostTag | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "find_user", label: "사람찾기" },
  { value: "suggestion", label: "건의사항" },
  { value: "etc", label: "기타" },
];

function isPostTag(value: string | undefined): value is PostTag {
  return value === "find_user" || value === "suggestion" || value === "etc";
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const { page: pageParam, tag: tagParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const tag = isPostTag(tagParam) ? tagParam : undefined;

  const { posts, pageSize, totalCount } = await getPostList(page, tag);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="animate-page-fade-in mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">게시판</h1>
        <TransitionLink href="/board/new">
          <Button className="bg-brand-gradient text-brand-foreground rounded-(--radius-card) hover:brightness-105">
            <PenLine size={16} />
            글쓰기
          </Button>
        </TransitionLink>
      </div>

      <div className="flex gap-1 border-b">
        {TAG_TABS.map((t) => {
          const isActive = (t.value === "all" && !tag) || t.value === tag;
          const href = t.value === "all" ? "/board" : `/board?tag=${t.value}`;
          return (
            <TransitionLink
              key={t.value}
              href={href}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium",
                isActive ? "border-brand text-brand" : "text-muted-foreground border-transparent"
              )}
            >
              {t.label}
            </TransitionLink>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {posts.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            아직 작성된 글이 없어요. 첫 글을 남겨보세요!
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>

      <BoardPagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={(p) => (tag ? `/board?tag=${tag}&page=${p}` : `/board?page=${p}`)}
      />
    </div>
  );
}
