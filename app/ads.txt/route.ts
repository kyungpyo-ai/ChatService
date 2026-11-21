import { adsenseClient } from "@/lib/ads/config";

/**
 * /ads.txt — 애드센스 게시자 인증용. 게시자 ID가 설정되지 않았으면 404.
 * (Google 공식 인증 ID f08c47fec0942fa0은 모든 게시자 공통)
 */
export function GET() {
  if (!adsenseClient) {
    return new Response("Not Found", { status: 404 });
  }

  const publisherId = adsenseClient.replace(/^ca-/, "");

  return new Response(`google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
