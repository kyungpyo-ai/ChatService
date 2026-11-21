/** 서비스 배포 도메인 — sitemap/robots/manifest/OG 메타에서 공통으로 쓴다. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/** 운영자 문의처 — 서비스 소개·개인정보처리방침(보호책임자)·청소년보호정책·약관에서 공통으로 쓴다. */
export const contactEmail = "contact@dalnaru.com";

/** 이용약관·개인정보처리방침·청소년보호정책 시행일 — 문서를 개정하면 함께 갱신한다. */
export const legalEffectiveDate = "2026년 11월 21일";
