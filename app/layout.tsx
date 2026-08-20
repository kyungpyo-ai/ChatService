import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { VersionWatcher } from "@/components/version-watcher";
import { getBuildVersion } from "@/lib/utils/build-version";
import { DmBadgeProvider } from "@/components/dm/dm-badge-provider";
import { siteUrl } from "@/lib/utils/site";
import "./globals.css";

const title = "달나루 — 로그인 없는 랜덤채팅, 익명채팅, 방채팅";
const description =
  "로그인 없이 바로 시작하는 무료 랜덤채팅, 관심사로 모이는 익명 채팅방. 달나루에서 새로운 대화를 시작해보세요.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    siteName: "달나루",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "달나루",
  url: siteUrl,
  description,
  inLanguage: "ko",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/*
          로고 워드마크·홈 히어로 헤드라인 전용 표시 서체(고운바탕). next/font/google은 이
          Next.js 버전에서 한글(korean) 서브셋을 지원하지 않아(§lib/utils/og-font.ts의
          동일 문제 참고) 일반 <link>로 Google Fonts CSS2 API를 직접 불러온다.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DmBadgeProvider>{children}</DmBadgeProvider>
          <Toaster />
          <VersionWatcher initialVersion={getBuildVersion()} />
        </ThemeProvider>
      </body>
    </html>
  );
}
