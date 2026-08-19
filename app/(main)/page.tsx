import { MessageCircle, Users } from "lucide-react";
import { HeroActionRow } from "@/components/home/hero-action-row";
import { AccessInfoList } from "@/components/home/access-info-list";
import { AdBanner } from "@/components/layout/ad-banner";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col justify-center px-4 py-6 md:min-h-screen">
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            새로운 대화를 시작해보세요 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            익명으로도, 로그인해도 즐겁게 대화할 수 있어요!
          </p>
        </div>

        <div className="space-y-3">
          <HeroActionRow
            href="/random"
            icon={MessageCircle}
            title="랜덤채팅 시작하기"
            subtitle="새로운 사람과 바로 대화해요"
            variant="brand"
          />
          <HeroActionRow
            href="/rooms"
            icon={Users}
            title="채팅방 둘러보기"
            subtitle="관심 있는 방에 참여해보세요"
          />
        </div>

        <AdBanner />

        <AccessInfoList />
      </div>
    </div>
  );
}
