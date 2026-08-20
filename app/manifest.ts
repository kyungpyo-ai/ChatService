import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "달나루",
    short_name: "달나루",
    description: "로그인 없이 바로 시작하는 랜덤채팅, 관심사로 모이는 채팅방",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfbf8",
    theme_color: "#8f6fc4",
    icons: [{ src: "/icon", sizes: "32x32", type: "image/png" }],
  };
}
