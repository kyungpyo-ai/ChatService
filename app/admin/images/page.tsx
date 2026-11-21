import Link from "next/link";
import Image from "next/image";
import { ExternalLink, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getAdminChatImages,
  type AdminChatImageItem,
  type AdminChatImageScope,
} from "@/lib/queries/admin-images";

/**
 * 이미지 모아보기 — 방채팅/랜덤채팅(진행 중 + 종료됨)에서 주고받은 이미지를 최신순 그리드로
 * 한 번에 훑어본다. 문제 이미지를 발견하면 "대화 보기"로 해당 대화 타임라인(기존 상세 화면)에
 * 들어가 맥락 확인·조치를 하는 흐름이다. 필터는 전부 쿼리스트링이라 새로고침/공유에도 유지된다.
 */

const PAGE_SIZE = 60;

const SCOPE_OPTIONS: { value: AdminChatImageScope; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "active_rooms", label: "방채팅 · 진행 중" },
  { value: "archived_rooms", label: "방채팅 · 종료됨" },
  { value: "active_random", label: "랜덤채팅 · 진행 중" },
  { value: "archived_random", label: "랜덤채팅 · 종료됨" },
];

const PERIOD_OPTIONS = [
  { value: "1", label: "오늘·어제" },
  { value: "7", label: "최근 7일" },
  { value: "30", label: "최근 30일" },
  { value: "365", label: "최근 1년" },
] as const;

const SOURCE_META: Record<
  AdminChatImageItem["source"],
  { label: string; ended: boolean; href: (id: string) => string }
> = {
  room: { label: "방채팅", ended: false, href: (id) => `/admin/rooms/${id}` },
  room_archive: { label: "방채팅", ended: true, href: (id) => `/admin/rooms/archived/${id}` },
  random_session: { label: "랜덤채팅", ended: false, href: (id) => `/admin/random/${id}` },
  random_archive: {
    label: "랜덤채팅",
    ended: true,
    href: (id) => `/admin/random/archived/${id}`,
  },
};

function parseScope(value?: string): AdminChatImageScope {
  return SCOPE_OPTIONS.some((o) => o.value === value) ? (value as AdminChatImageScope) : "all";
}

function parsePeriod(value?: string): string {
  return PERIOD_OPTIONS.some((o) => o.value === value) ? (value as string) : "7";
}

function buildHref(params: { scope: string; period: string; page?: number }) {
  const search = new URLSearchParams({ scope: params.scope, period: params.period });
  if (params.page && params.page > 1) search.set("page", String(params.page));
  return `/admin/images?${search.toString()}`;
}

function formatKst(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminImagesPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; period?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const scope = parseScope(sp.scope);
  const period = parsePeriod(sp.period);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const now = new Date();
  // "오늘·어제"는 최근 24시간이 아니라 넉넉하게 48시간 — 새벽에 확인할 때 전날 밤 이미지가 빠지지 않도록
  const days = period === "1" ? 2 : Number(period);
  const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  // 다음 페이지 존재 여부를 알기 위해 1장 더 가져온다
  const fetched = await getAdminChatImages({
    dateFrom,
    dateTo: now.toISOString(),
    scope,
    limit: PAGE_SIZE + 1,
    offset: (page - 1) * PAGE_SIZE,
  });
  const hasNext = fetched.length > PAGE_SIZE;
  const images = fetched.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">이미지 모아보기</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          방채팅·랜덤채팅에서 주고받은 이미지를 최신순으로 보여줍니다. 이미지를 누르면 원본이 새
          탭으로 열리고, &quot;대화 보기&quot;로 해당 대화의 전체 맥락을 확인할 수 있습니다.
        </p>
      </div>

      <div className="space-y-2">
        <FilterRow
          options={SCOPE_OPTIONS}
          current={scope}
          hrefFor={(value) => buildHref({ scope: value, period })}
        />
        <FilterRow
          options={PERIOD_OPTIONS}
          current={period}
          hrefFor={(value) => buildHref({ scope, period: value })}
        />
      </div>

      {images.length === 0 ? (
        <div className="bg-surface text-muted-foreground rounded-md border p-10 text-center text-sm">
          조건에 맞는 이미지가 없습니다.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {images.map((image) => (
            <ImageCard key={`${image.source}-${image.contextId}-${image.path}`} image={image} />
          ))}
        </ul>
      )}

      {(page > 1 || hasNext) && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link
              href={buildHref({ scope, period, page: page - 1 })}
              className="rounded-md border px-3 py-1.5 hover:underline"
            >
              이전
            </Link>
          ) : (
            <span className="text-muted-foreground rounded-md border px-3 py-1.5 opacity-50">
              이전
            </span>
          )}
          <span className="text-muted-foreground">{page} 페이지</span>
          {hasNext ? (
            <Link
              href={buildHref({ scope, period, page: page + 1 })}
              className="rounded-md border px-3 py-1.5 hover:underline"
            >
              다음
            </Link>
          ) : (
            <span className="text-muted-foreground rounded-md border px-3 py-1.5 opacity-50">
              다음
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  options,
  current,
  hrefFor,
}: {
  options: readonly { value: string; label: string }[];
  current: string;
  hrefFor: (value: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Link
          key={option.value}
          href={hrefFor(option.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            option.value === current
              ? "bg-brand-muted text-brand border-transparent"
              : "bg-surface text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

function ImageCard({ image }: { image: AdminChatImageItem }) {
  const meta = SOURCE_META[image.source];

  return (
    <li className="bg-surface overflow-hidden rounded-md border">
      {image.url ? (
        <a
          href={image.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-surface-muted relative block aspect-square"
          title="원본 보기"
        >
          <Image
            src={image.url}
            alt="채팅 첨부 이미지"
            fill
            sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover"
            unoptimized
          />
        </a>
      ) : (
        <div className="bg-surface-muted text-muted-foreground flex aspect-square flex-col items-center justify-center gap-1 text-xs">
          <ImageOff size={20} />
          파일 없음
        </div>
      )}

      <div className="space-y-1 p-2 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {meta.label}
          </Badge>
          <Badge variant={meta.ended ? "secondary" : "default"} className="px-1.5 py-0 text-[10px]">
            {meta.ended ? "종료됨" : "진행 중"}
          </Badge>
        </div>
        {image.contextTitle && (
          <p className="truncate font-medium" title={image.contextTitle}>
            {image.contextTitle}
          </p>
        )}
        <p className="text-muted-foreground truncate">
          {image.senderId ? (
            <Link href={`/admin/users/${image.senderId}`} className="hover:underline">
              {image.senderName ?? "알 수 없음(만료된 게스트/탈퇴)"}
            </Link>
          ) : (
            "알 수 없음"
          )}
        </p>
        <div className="flex items-center justify-between gap-1">
          <span className="text-muted-foreground">{formatKst(image.createdAt)}</span>
          <Link
            href={meta.href(image.contextId)}
            className="text-brand inline-flex shrink-0 items-center gap-0.5 hover:underline"
          >
            대화 보기
            <ExternalLink size={11} />
          </Link>
        </div>
      </div>
    </li>
  );
}
