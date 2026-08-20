"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, Flag, MoreVertical, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TransitionLink } from "@/components/ui/transition-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from "@/components/chat/report-dialog";
import { PostTagBadge } from "@/components/board/post-card";
import {
  createPostCommentAction,
  deletePostAction,
  deletePostCommentAction,
  incrementPostViewCountAction,
} from "@/app/actions/board";
import { formatChatDate, formatChatTime } from "@/lib/utils/date";
import { showError, showSuccess } from "@/lib/utils/toast";
import type { PostDetail } from "@/lib/queries/board";

interface PostDetailViewProps {
  post: PostDetail;
  /** 로그인 사용자 본인 id — 작성자 판별(내 글/내 댓글 삭제 버튼 노출)용. 비로그인이면 null. */
  currentUserId: string | null;
}

/** 게시글 상세 + 댓글(§ROADMAP Phase 12) — 쪽지 상세(dm-note-detail.tsx)와 유사한 카드 레이아웃. */
export function PostDetailView({ post, currentUserId }: PostDetailViewProps) {
  const router = useRouter();
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, startCommentTransition] = useTransition();
  const [isDeletingPost, startDeleteTransition] = useTransition();
  const [reportTarget, setReportTarget] = useState<{ type: "post" | "comment"; id: string } | null>(
    null
  );

  // 조회수는 상세 화면에 실제로 들어왔을 때 한 번만 증가시킨다(부수효과라 서버 렌더 경로가
  // 아니라 마운트 시 fire-and-forget으로 처리 — getPostDetail 자체에서 증가시키면 캐시된
  // RSC 재렌더/prefetch만으로도 카운트가 올라갈 수 있다).
  useEffect(() => {
    void incrementPostViewCountAction(post.id);
  }, [post.id]);

  const isAuthor = currentUserId === post.authorId;

  const handleDeletePost = () => {
    startDeleteTransition(async () => {
      const result = await deletePostAction(post.id);
      if (!result.success) {
        showError(result.message);
        return;
      }
      showSuccess("게시글을 삭제했습니다.");
      router.push("/board");
    });
  };

  const handleSubmitComment = () => {
    const trimmed = commentContent.trim();
    if (!trimmed) return;

    startCommentTransition(async () => {
      const result = await createPostCommentAction(post.id, trimmed);
      if (!result.success) {
        showError(result.message);
        return;
      }
      setCommentContent("");
      router.refresh();
    });
  };

  const handleDeleteComment = (commentId: string) => {
    void deletePostCommentAction(commentId, post.id).then((result) => {
      if (!result.success) {
        showError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <TransitionLink href="/board">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1">
            <ChevronLeft size={16} />
            목록으로
          </Button>
        </TransitionLink>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="더보기">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAuthor ? (
              <DropdownMenuItem
                onClick={handleDeletePost}
                disabled={isDeletingPost}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setReportTarget({ type: "post", id: post.id })}>
                <Flag className="mr-2 h-4 w-4" />
                신고
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-surface space-y-3 rounded-(--radius-card) border p-5">
        <PostTagBadge tag={post.tag} />
        <h1 className="text-lg font-bold">{post.title}</h1>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.authorAvatarUrl ?? undefined} alt={post.authorNickname} />
            <AvatarFallback>{post.authorNickname[0]}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{post.authorNickname}</p>
            <p className="text-muted-foreground text-xs" suppressHydrationWarning>
              {formatChatDate(post.createdAt)} · {formatChatTime(post.createdAt)}
            </p>
          </div>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <Eye size={12} />
            {post.viewCount}
          </span>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">댓글 {post.comments.length}</p>

        {post.comments.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center text-sm">첫 댓글을 남겨보세요.</p>
        ) : (
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-2">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage
                    src={comment.authorAvatarUrl ?? undefined}
                    alt={comment.authorNickname}
                  />
                  <AvatarFallback>{comment.authorNickname[0]}</AvatarFallback>
                </Avatar>
                <div className="bg-surface-muted min-w-0 flex-1 rounded-(--radius-card) px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{comment.authorNickname}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[10px]" suppressHydrationWarning>
                        {formatChatTime(comment.createdAt)}
                      </span>
                      {currentUserId === comment.authorId ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="댓글 삭제"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReportTarget({ type: "comment", id: comment.id })}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="댓글 신고"
                        >
                          <Flag size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentUserId ? (
          <div className="space-y-2">
            <Textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력하세요"
              rows={3}
              disabled={isSubmittingComment}
            />
            <div className="flex justify-end">
              <Button
                className="bg-brand-gradient text-brand-foreground hover:brightness-105"
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || !commentContent.trim()}
              >
                {isSubmittingComment ? "작성 중..." : "댓글 작성"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground py-2 text-center text-xs">
            댓글을 작성하려면 로그인이 필요합니다.
          </p>
        )}
      </div>

      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onOpenChange={(open) => !open && setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </div>
  );
}
