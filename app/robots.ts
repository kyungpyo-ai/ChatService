import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/dm", "/admin", "/api/", "/auth/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
