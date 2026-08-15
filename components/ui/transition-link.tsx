"use client";

import { startTransition, type MouseEvent } from "react";
import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";

type TransitionLinkProps = LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

/**
 * next/link를 감싸서 클릭 시 이동을 React startTransition 안에서 처리하는 래퍼.
 *
 * 그냥 <Link>는 클릭하는 즉시 대상 라우트의 loading.tsx(있다면)로 화면을 곧바로 대체한다 —
 * 응답이 빠른 경우에도 "현재 화면 → 빈/스켈레톤 화면 → 실제 내용"처럼 한 번 더 깜빡이는
 * 것처럼 보인다(실사용 확인). startTransition으로 감싸면 Next가 목적지 데이터가 준비될
 * 때까지 지금 화면을 그대로 유지하다가 한 번에 교체하므로, 응답이 빠르면 로딩 화면이 아예
 * 안 보이고 느릴 때만 자연스럽게 넘어간다. 새 탭 열기(ctrl/cmd/shift/가운데 클릭) 등
 * 브라우저 기본 동작은 그대로 둔다.
 */
export function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    startTransition(() => {
      router.push(typeof href === "string" ? href : href.pathname + (href.search ?? ""));
    });
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
