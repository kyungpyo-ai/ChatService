import type { VercelConfig } from "@vercel/config/v1/types";

// UTC 19:00 = KST 새벽 4시(기존 Supabase pg_cron 배치들의 "새벽" 실행 시간대와 맞춤).
// 엔드포인트 자체(app/api/cron/cleanup-chat-images/route.ts)는 CRON_SECRET으로 스스로를
// 보호하며, Vercel Cron은 그 값이 설정되어 있으면 호출 시 Authorization 헤더를 자동으로 붙인다.
export const config: VercelConfig = {
  crons: [
    { path: "/api/cron/cleanup-chat-images", schedule: "0 19 * * *" },
    // 5분 뒤로 어긋나게 잡아 같은 시각에 두 배치가 겹치지 않게 한다.
    { path: "/api/cron/cleanup-old-dm-notes", schedule: "5 19 * * *" },
  ],
  // Supabase 프로젝트가 서울(ap-northeast-2)에 있는데 함수 리전 설정이 없으면 기본 리전(미국)
  // 에서 실행되어, 미들웨어/Server Action이 RPC 하나 호출할 때마다 태평양을 왕복해 페이지
  // 진입/매칭/매칭취소 같은 짧은 동작까지 체감상 느려진다. icn1(서울)로 고정해 Supabase와
  // 함수를 같은 리전에 두어 이 왕복 지연을 없앤다.
  regions: ["icn1"],
};
