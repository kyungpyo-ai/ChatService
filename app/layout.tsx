import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { VersionWatcher } from "@/components/version-watcher";
import { getBuildVersion } from "@/lib/utils/build-version";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/queries/profile";
import { getDmUnreadCount } from "@/lib/queries/dm";
import { DmBadgeProvider } from "@/components/dm/dm-badge-provider";
import "./globals.css";

const defaultUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "수다온 — 익명 채팅",
  description:
    "로그인 없이 바로 시작하는 랜덤채팅, 관심사로 모이는 채팅방. 수다온에서 새로운 대화를 시작해보세요.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 쪽지함 안읽음 배지 Realtime 구독을 앱 최상위에 딱 한 번만 마운트하기 위한 초기값 계산
  // (§lib/realtime/dm-badge.ts, §components/dm/dm-badge-provider.tsx 참고 — route group을
  // 오가도 이 구독이 절대 언마운트되지 않아야 하는 이유가 문서화돼 있다). 게스트(익명 세션)는
  // profiles가 아니라 guest_profiles에 저장되므로(§CLAUDE.md) profile 존재 여부로 판단한다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user ? await getUserProfile(user.id) : null;
  const dmUserId = profile ? user!.id : null;
  const initialDmUnreadCount = dmUserId ? await getDmUnreadCount(dmUserId) : 0;

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <DmBadgeProvider userId={dmUserId} initialCount={initialDmUnreadCount}>
            {children}
          </DmBadgeProvider>
          <Toaster />
          <VersionWatcher initialVersion={getBuildVersion()} />
        </ThemeProvider>
      </body>
    </html>
  );
}
