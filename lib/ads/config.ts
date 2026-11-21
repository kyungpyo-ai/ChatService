/**
 * 광고 네트워크 설정 — 전부 환경변수로만 켜고 끈다.
 *
 * - 카카오 애드핏: 광고단위 ID(DAN-xxxx)가 위치별로 따로 발급되므로 위치마다 하나씩 둔다.
 * - 구글 애드센스: 게시자 ID(ca-pub-xxxx) 하나 + 위치별 광고 슬롯 ID.
 *
 * 같은 위치에 두 네트워크가 모두 설정돼 있으면 애드핏을 우선한다(국내 사이트 심사가 더 빨라
 * 먼저 붙을 가능성이 높음). 아무것도 설정되지 않으면 AdBanner는 아무것도 렌더링하지 않는다.
 *
 * NEXT_PUBLIC_* 값은 빌드 시점에 인라인되므로 반드시 `process.env.NEXT_PUBLIC_X` 형태로
 * 정적으로 참조해야 한다(동적 키 접근 금지).
 */

export type AdSlot = "inline" | "sidebar";

/** 위치별 광고 크기 — 애드핏은 광고단위를 만들 때 이 크기로 생성해야 한다. */
export const AD_SIZES: Record<AdSlot, { width: number; height: number }> = {
  // 모바일 폭(320px)에서도 잘리지 않는 배너
  inline: { width: 320, height: 100 },
  // PC 사이드바(w-60, 내부 폭 208px)에 들어가는 세로형
  sidebar: { width: 160, height: 600 },
};

const adfitUnits: Record<AdSlot, string | undefined> = {
  inline: process.env.NEXT_PUBLIC_ADFIT_UNIT_INLINE || undefined,
  sidebar: process.env.NEXT_PUBLIC_ADFIT_UNIT_SIDEBAR || undefined,
};

/** 애드센스 게시자 ID (예: ca-pub-1234567890123456) — 사이트 소유 확인/ads.txt에도 쓰인다. */
export const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || undefined;

const adsenseSlots: Record<AdSlot, string | undefined> = {
  inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || undefined,
  sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || undefined,
};

export type ResolvedAd =
  | { provider: "adfit"; unit: string }
  | { provider: "adsense"; client: string; slot: string }
  | null;

/** 해당 위치에 실제로 띄울 광고를 결정한다. */
export function resolveAd(slot: AdSlot): ResolvedAd {
  const adfitUnit = adfitUnits[slot];
  if (adfitUnit) return { provider: "adfit", unit: adfitUnit };

  const adsenseSlot = adsenseSlots[slot];
  if (adsenseClient && adsenseSlot) {
    return { provider: "adsense", client: adsenseClient, slot: adsenseSlot };
  }

  return null;
}
