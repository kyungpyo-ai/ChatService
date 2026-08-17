"use client";

import { useLinkStatus } from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * useLinkStatus는 부모 <Link>의 자식으로 렌더링된 컴포넌트에서만 pending 상태를 읽을 수 있다.
 * 클릭 즉시(네트워크 왕복 전) 스피너로 바뀌어야 "버튼이 반응했다"는 걸 바로 알 수 있다
 * (§실사용 피드백 — 버튼 클릭 후 아무 반응 없이 멈춘 것처럼 보이는 문제).
 *
 * 이 파일만 별도로 분리해 클라이언트 컴포넌트로 둔다 — HeroActionRow 자체를 클라이언트
 * 컴포넌트로 만들면 Server Component인 호출부(app/(main)/page.tsx)가 넘기는 `icon`
 * prop(Lucide 아이콘 컴포넌트, 즉 함수)이 서버→클라이언트 경계를 건너가며 직렬화가 불가능해
 * 500 에러가 났다("use server"로 감싸지 않은 함수는 Client Component에 prop으로 못 넘김).
 * isBrand 같은 직렬화 가능한 값만 받는 leaf 컴포넌트로 쪼개면 이 문제가 없다.
 */
export function NavPendingIcon({ isBrand }: { isBrand: boolean }) {
  const { pending } = useLinkStatus();
  const className = isBrand ? "text-brand-foreground/80" : "text-muted-foreground";

  if (pending) {
    return <Loader2 size={20} className={cn("animate-spin", className)} />;
  }

  return <ChevronRight size={20} className={className} />;
}
