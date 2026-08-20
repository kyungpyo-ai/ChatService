/** 서비스 배포 도메인 — sitemap/robots/manifest/OG 메타에서 공통으로 쓴다. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
