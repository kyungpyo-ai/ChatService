/**
 * 랜덤채팅 탭 종료 시 sendBeacon으로 도착하는 "즉시 종료" 신호 (2026-08-16)
 *
 * 브라우저가 탭을 닫거나 다른 페이지로 이동할 때 발생하는 pagehide 이벤트에서
 * navigator.sendBeacon()으로 호출된다(§lib/realtime/random.ts) — sendBeacon은 페이지가
 * 언로드되는 도중에도 요청 전송을 보장해주는 브라우저 API지만, 응답을 읽을 수 없고 커스텀
 * 헤더도 못 붙이므로 일반 fetch 기반 서버 액션 대신 단순 POST Route Handler로 받는다.
 *
 * 인증은 브라우저가 sendBeacon 요청에도 동일 출처 쿠키를 자동으로 실어주는 것에 의존한다
 * (세션/서버 액션과 동일한 createClient() 쿠키 기반 인증) — 별도 토큰 처리가 필요 없다.
 *
 * "종료" 버튼(endRandomSessionAction)과 완전히 같은 end_random_session() RPC를 호출한다 —
 * status='active' 조건으로 이미 종료된 세션에 대한 중복 호출은 DB 함수 내부에서 조용히
 * 무시되므로 안전하다.
 *
 * 이 신호는 어디까지나 "되면 좋은" best-effort 빠른 경로다 — 모바일 브라우저에서는 페이지가
 * 언로드되는 도중 sendBeacon 전송이 완료되기 전에 프로세스가 죽어 신호 자체가 유실될 수 있다
 * (§ROADMAP.md, 방채팅 자동종료 기능에서 동일한 문제로 원복한 전례가 있음). 그래서 이 경로가
 * 실패하는 경우를 대비해 lib/realtime/random.ts의 세션 하트비트(최대 약 35초)가 항상 최종
 * 안전망으로 남아 있다 — 이 엔드포인트는 그 안전망을 대체하지 않고 속도만 보강한다.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: unknown };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId : null;

    if (!sessionId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = await createClient();
    await supabase.rpc("end_random_session", { p_session_id: sessionId });

    return NextResponse.json({ ok: true });
  } catch {
    // sendBeacon 호출부는 응답을 읽지 않으므로 실패해도 별도로 알릴 대상이 없다 — 하트비트가
    // 최종 안전망 역할을 한다.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
