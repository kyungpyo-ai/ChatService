/**
 * 낙관적 UI용 임시 ID 생성기
 *
 * crypto.randomUUID()는 브라우저가 "보안 컨텍스트"(HTTPS 또는 localhost)일 때만 제공된다 —
 * LAN IP로 접속한 http:// 환경(예: 모바일 실기기 테스트)에서는 존재하지 않아 호출 시 바로
 * TypeError가 나서 메시지 전송이 클라이언트에서 죽는 문제가 있었다(§실사용 확인, 2026-08-16).
 * 이 ID는 서버에 저장되지 않는 화면 전용 임시 키라 암호학적 무작위성이 필요 없으므로,
 * 항상 동작하는 방식으로 대체한다.
 */
export function generateTempId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
