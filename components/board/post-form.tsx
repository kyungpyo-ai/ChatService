"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showError } from "@/lib/utils/toast";
import { createPostAction } from "@/app/actions/board";
import type { PostTag } from "@/lib/queries/board";

const TAG_OPTIONS: { value: PostTag; label: string }[] = [
  { value: "find_user", label: "사람찾기" },
  { value: "suggestion", label: "건의사항" },
  { value: "etc", label: "기타" },
];

/** 게시글 작성 폼 — 로그인 회원만 접근하는 /board/new 전용(§ROADMAP Phase 12). */
export function PostForm() {
  const router = useRouter();
  const [tag, setTag] = useState<PostTag>("find_user");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showError("제목과 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const result = await createPostAction(tag, title, content);
    setIsSubmitting(false);

    if (!result.success) {
      showError(result.message);
      return;
    }

    router.push(`/board/${result.data!.postId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">태그</label>
        <Select value={tag} onValueChange={(v) => setTag(v as PostTag)}>
          <SelectTrigger className="w-full" disabled={isSubmitting}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAG_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">제목</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요"
          maxLength={100}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">내용</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요"
          maxLength={5000}
          rows={10}
          disabled={isSubmitting}
        />
      </div>

      <Button
        type="submit"
        className="bg-brand-gradient text-brand-foreground w-full rounded-(--radius-card) hover:brightness-105"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            작성 중...
          </>
        ) : (
          "작성 완료"
        )}
      </Button>
    </form>
  );
}
