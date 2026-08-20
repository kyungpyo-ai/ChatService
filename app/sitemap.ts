import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils/site";

/**
 * 검색엔진에 노출할 공개 페이지 목록. 개인/1:1 페이지(profile, dm, admin, 채팅방 상세,
 * 랜덤채팅 세션)는 페이지 자체의 `robots: { index: false }`로 막혀 있으므로 여기서는
 * 다루지 않는다 — sitemap은 "색인해달라"는 요청이라 애초에 노출 대상만 담는다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/rooms`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/random`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/board`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${siteUrl}/auth/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/auth/sign-up`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/legal/terms`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/legal/privacy`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${siteUrl}/legal/youth-protection`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(1000);

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${siteUrl}/board/${post.id}`,
    lastModified: post.updated_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
