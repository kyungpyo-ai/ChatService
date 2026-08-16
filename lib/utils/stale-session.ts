/**
 * 이미 삭제된 계정의 옛 로그인 세션으로 쓰기 요청을 감지한다.
 *
 * 로컬 JWT 서명만 검증하는 getClaims()는 계정이 삭제된 뒤에도 만료 전까지 "로그인됨"으로
 * 통과시킨다 — 실제로는 auth.users에 그 행이 없으니, 그 사용자 id를 참조하는 INSERT/RPC가
 * Postgres 외래키 위반(23503)으로 실패하면서 뒤늦게 드러난다. 이 프로젝트에서 23503이 나는
 * 경로는 대부분 "요청자 자신의 계정이 사라졌다"는 뜻이므로(방/세션 자체가 없는 경우는 각
 * 함수가 이미 명시적으로 걸러낸다), 위반된 제약 이름이 사용자 참조 컬럼(user_id/sender_id/
 * user_a_id/user_b_id)인 경우만 감지한다.
 */
const USER_REFERENCE_FK_HINTS = [
  "_user_id_fkey",
  "_sender_id_fkey",
  "_user_a_id_fkey",
  "_user_b_id_fkey",
];

export function isStaleSessionError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (error?.code !== "23503") return false;
  return USER_REFERENCE_FK_HINTS.some((hint) => error.message?.includes(hint));
}
