import type { VercelConfig } from "@vercel/config/v1/types";

// UTC 19:00 = KST 새벽 4시(기존 Supabase pg_cron 배치들의 "새벽" 실행 시간대와 맞춤).
// 엔드포인트 자체(app/api/cron/cleanup-chat-images/route.ts)는 CRON_SECRET으로 스스로를
// 보호하며, Vercel Cron은 그 값이 설정되어 있으면 호출 시 Authorization 헤더를 자동으로 붙인다.
export const config: VercelConfig = {
  crons: [{ path: "/api/cron/cleanup-chat-images", schedule: "0 19 * * *" }],
};
