"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchX } from "lucide-react";
import { showError } from "@/lib/utils/toast";
import type { AdminMessageSearchResult } from "@/lib/queries/admin";

const SCOPE_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "active_rooms", label: "방채팅(진행 중)" },
  { value: "active_random", label: "랜덤채팅(진행 중)" },
  { value: "archived_rooms", label: "방채팅(아카이브)" },
  { value: "archived_random", label: "랜덤채팅(아카이브)" },
] as const;

const SOURCE_LABEL: Record<AdminMessageSearchResult["source"], string> = {
  room: "방채팅",
  random_session: "랜덤채팅",
  room_archive: "방채팅(아카이브)",
  random_archive: "랜덤채팅(아카이브)",
};

function targetHref(result: AdminMessageSearchResult): string {
  switch (result.source) {
    case "room":
      return `/admin/rooms/${result.contextId}`;
    case "random_session":
      return `/admin/random/${result.contextId}`;
    case "room_archive":
      return `/admin/rooms/archived/${result.contextId}`;
    case "random_archive":
      return `/admin/random/archived/${result.contextId}`;
  }
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface MessageSearchPanelProps {
  searchAction: (
    query: string,
    dateFrom: string,
    dateTo: string,
    scope: string
  ) => Promise<AdminMessageSearchResult[]>;
}

/**
 * 검색어/날짜/범위 폼 + 결과 리스트(§DEVELOPMENT_PLAN 7.5.6). 기본 날짜 범위는 최근 7일,
 * 최대 30일로 제한한다(아카이브 보존 기한과 동일하게 UI에서도 제한해 헛수고 방지).
 */
export function MessageSearchPanel({ searchAction }: MessageSearchPanelProps) {
  const router = useRouter();
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState(toDateInputValue(weekAgo));
  const [dateTo, setDateTo] = useState(toDateInputValue(today));
  const [scope, setScope] = useState("all");
  const [results, setResults] = useState<AdminMessageSearchResult[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    if (query.trim().length < 2) {
      showError("검색어는 2자 이상 입력해주세요.");
      return;
    }

    startTransition(async () => {
      const data = await searchAction(
        query.trim(),
        new Date(dateFrom).toISOString(),
        new Date(`${dateTo}T23:59:59`).toISOString(),
        scope
      );
      setResults(data);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">키워드</label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어 (2자 이상)"
            className="w-48"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">시작일</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">종료일</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-muted-foreground mb-1 block text-xs">범위</label>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} disabled={isPending}>
          검색
        </Button>
      </div>

      {results !== null &&
        (results.length === 0 ? (
          <EmptyState icon={SearchX} title="검색 결과가 없습니다." />
        ) : (
          <ul className="space-y-2">
            {results.map((result, index) => (
              <li
                key={`${result.source}-${result.contextId}-${index}`}
                className="bg-surface rounded-md border p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge variant="outline">{SOURCE_LABEL[result.source]}</Badge>
                  <span className="text-muted-foreground text-xs">
                    {new Date(result.createdAt).toLocaleString("ko-KR")}
                  </span>
                </div>
                <p className="mb-1 line-clamp-2">{result.content}</p>
                <Link
                  href={targetHref(result)}
                  className="text-brand text-xs hover:underline"
                  onClick={() => router.prefetch(targetHref(result))}
                >
                  상세로 이동
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
