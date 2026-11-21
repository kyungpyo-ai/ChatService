"use client";

import { useEffect, useRef } from "react";

const ADFIT_SCRIPT_SRC = "https://t1.daumcdn.net/kas/static/ba.min.js";

interface AdfitUnitProps {
  unit: string;
  width: number;
  height: number;
}

/**
 * 카카오 애드핏 광고단위
 *
 * 애드핏 스크립트(ba.min.js)는 실행 시점에 페이지의 `ins.kakao_ad_area`를 찾아 광고를 채운다.
 * SPA 라우팅에서는 페이지 이동 후 스크립트가 다시 실행되지 않으므로, 마운트될 때마다
 * ins + script를 직접 만들어 붙이고 언마운트 시 비운다.
 */
export function AdfitUnit({ unit, width, height }: AdfitUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit", unit);
    ins.setAttribute("data-ad-width", String(width));
    ins.setAttribute("data-ad-height", String(height));

    const script = document.createElement("script");
    script.async = true;
    script.src = ADFIT_SCRIPT_SRC;

    container.append(ins, script);

    return () => {
      container.replaceChildren();
    };
  }, [unit, width, height]);

  return <div ref={containerRef} style={{ width, minHeight: height }} />;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdsenseUnitProps {
  client: string;
  slot: string;
  /** 지정하면 고정 크기 광고, 생략하면 컨테이너 폭에 맞춘 반응형 광고 */
  width?: number;
  height?: number;
}

/**
 * 구글 애드센스 광고단위
 *
 * adsbygoogle.js 자체는 루트 레이아웃에서 한 번만 로드하고, 여기서는 ins를 렌더링한 뒤
 * push({})로 광고 요청만 보낸다. 개발 모드(StrictMode)의 이중 effect 실행 시 나는
 * "already have ads" 에러는 무시한다.
 */
export function AdsenseUnit({ client, slot, width, height }: AdsenseUnitProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 이미 채워진 ins에 다시 push하면 예외가 나는데, 동작에는 영향 없음
    }
  }, [slot]);

  const fixedSize = width !== undefined && height !== undefined;

  return (
    <ins
      className="adsbygoogle"
      style={fixedSize ? { display: "inline-block", width, height } : { display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      {...(fixedSize ? {} : { "data-ad-format": "auto", "data-full-width-responsive": "true" })}
    />
  );
}
