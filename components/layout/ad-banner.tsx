import { cn } from "@/lib/utils";
import { AD_SIZES, resolveAd } from "@/lib/ads/config";
import { AdfitUnit, AdsenseUnit } from "@/components/layout/ad-units";

interface AdBannerProps {
  variant?: "inline" | "sidebar";
  className?: string;
}

/**
 * 광고 영역 — 카카오 애드핏 / 구글 애드센스 중 환경변수로 설정된 네트워크를 띄운다
 * (설정 규칙은 `lib/ads/config.ts` 참고). 해당 위치에 설정된 광고가 없으면 아무것도
 * 렌더링하지 않으므로, 호출부(홈/방목록/사이드바/랜덤채팅 매칭 대기)는 광고 연동 여부를 신경 쓸 필요가 없다.
 */
export function AdBanner({ variant = "inline", className }: AdBannerProps) {
  const ad = resolveAd(variant);
  if (!ad) return null;

  const size = AD_SIZES[variant];

  return (
    <div
      className={cn(
        "flex justify-center overflow-hidden",
        // 세로형(600px) 광고는 화면이 낮으면 사이드바 메뉴/프로필 영역을 밀어내므로 숨긴다
        variant === "sidebar" && "[@media(max-height:959px)]:hidden",
        className
      )}
    >
      {ad.provider === "adfit" ? (
        <AdfitUnit unit={ad.unit} width={size.width} height={size.height} />
      ) : variant === "sidebar" ? (
        <AdsenseUnit client={ad.client} slot={ad.slot} width={size.width} height={size.height} />
      ) : (
        <div className="w-full">
          <AdsenseUnit client={ad.client} slot={ad.slot} />
        </div>
      )}
    </div>
  );
}
