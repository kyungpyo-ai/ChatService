import Link from "next/link";
import { contactEmail } from "@/lib/utils/site";

const FOOTER_LINKS = [
  { href: "/about", label: "서비스 소개" },
  { href: "/guide", label: "이용 가이드" },
  { href: "/faq", label: "자주 묻는 질문" },
  { href: "/legal/terms", label: "이용약관" },
  { href: "/legal/privacy", label: "개인정보처리방침" },
  { href: "/legal/youth-protection", label: "청소년보호정책" },
] as const;

/**
 * (main) 레이아웃 공용 하단 링크 — 어느 페이지에서든 서비스 소개·약관·개인정보처리방침·문의처에
 * 닿을 수 있게 한다(광고 네트워크 심사가 정책 페이지 접근성과 운영자 연락처를 확인함).
 * 개인정보처리방침은 "개인정보처리방침"이라는 명칭으로 다른 링크와 구분해 굵게 표시한다(국내 관행).
 */
export function SiteFooter() {
  return (
    <footer className="text-muted-foreground mx-auto max-w-2xl space-y-1.5 px-4 py-4 text-center text-xs">
      <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {FOOTER_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={
              href === "/legal/privacy"
                ? "text-foreground font-semibold hover:underline"
                : "hover:text-foreground hover:underline"
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      <p>
        문의:{" "}
        <a href={`mailto:${contactEmail}`} className="hover:text-foreground hover:underline">
          {contactEmail}
        </a>{" "}
        · © 달나루
      </p>
    </footer>
  );
}
