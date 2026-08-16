/**
 * app/icon.tsx, app/opengraph-image.tsx 전용 — 동적 OG 이미지 생성(next/og ImageResponse,
 * satori 기반)은 시스템 폰트를 못 쓰고 직접 폰트 바이트를 넘겨줘야 하는데, 기본 내장 폰트는
 * 한글 글리프가 없어 "수다온" 같은 텍스트가 안 그려진다. Google Fonts CSS2 API에 구형
 * User-Agent로 요청하면 woff(비-woff2) 형식 URL을 받을 수 있고, satori는 ttf/otf/woff만
 * 지원한다 — &text= 파라미터로 실제 쓰는 글자만 서브셋 요청해 용량도 최소화한다.
 */
export async function loadKoreanFont(text: string, weight: 400 | 700 = 700): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (
    await fetch(cssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.168 Safari/535.19",
      },
    })
  ).text();

  const fontUrl = css.match(/src: url\(([^)]+)\)/)?.[1];
  if (!fontUrl) {
    throw new Error("Google Fonts 응답에서 폰트 URL을 찾지 못했습니다.");
  }

  const fontResponse = await fetch(fontUrl);
  return fontResponse.arrayBuffer();
}
