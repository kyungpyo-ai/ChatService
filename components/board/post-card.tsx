import { Eye, MessageCircle } from "lucide-react";
import { TransitionLink } from "@/components/ui/transition-link";
import { formatNoteDate } from "@/lib/utils/date";
import type { PostListItem, PostTag } from "@/lib/queries/board";

const TAG_LABEL: Record<PostTag, string> = {
  find_user: "사람찾기",
  suggestion: "건의사항",
  etc: "기타",
};

const TAG_STYLE: Record<PostTag, string> = {
  find_user: "bg-brand-muted text-brand",
  suggestion: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  etc: "bg-surface-muted text-muted-foreground",
};

export function PostTagBadge({ tag }: { tag: PostTag }) {
  return (
    <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${TAG_STYLE[tag]}`}>
      {TAG_LABEL[tag]}
    </span>
  );
}

export function PostCard({ post }: { post: PostListItem }) {
  return (
    <TransitionLink
      href={`/board/${post.id}`}
      className="bg-surface hover:bg-surface-muted block rounded-(--radius-card) border p-4 shadow-(--shadow-card)"
    >
      <div className="flex items-start gap-2">
        <PostTagBadge tag={post.tag} />
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{post.title}</p>
      </div>

      <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
        <span className="font-medium">{post.authorNickname}</span>
        <span>{formatNoteDate(post.createdAt)}</span>
        <span className="ml-auto flex items-center gap-1">
          <MessageCircle size={12} />
          {post.commentCount}
        </span>
        <span className="flex items-center gap-1">
          <Eye size={12} />
          {post.viewCount}
        </span>
      </div>
    </TransitionLink>
  );
}
