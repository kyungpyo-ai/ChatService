import { ImageResponse } from "next/og";
import { loadKoreanFont } from "@/lib/utils/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BRAND_COLOR = "#5358ee";
const TITLE = "수다온";
const TAGLINE = "로그인 없이 바로 시작하는 랜덤채팅";

export default async function OpengraphImage() {
  const fontData = await loadKoreanFont(TITLE + TAGLINE, 700);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_COLOR,
          fontFamily: "Noto Sans KR",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 160,
            height: 160,
            background: "rgba(255,255,255,0.16)",
            borderRadius: 40,
            marginBottom: 40,
          }}
        >
          <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
              fill="white"
            />
          </svg>
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "white" }}>
          {TITLE}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 32,
            marginTop: 20,
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {TAGLINE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Noto Sans KR", data: fontData, style: "normal", weight: 700 }],
    }
  );
}
