/**
 * 배포마다 바뀌는 빌드 식별자 — 버전 스큐(구버전 탭) 감지에 사용한다.
 *
 * Vercel이 런타임에 자동 주입하는 커밋 SHA를 그대로 쓴다. 새 배포가 production alias로
 * 승격되면 이 값도 바뀌므로, 열려있던 탭이 처음 받은 값과 지금 서버가 반환하는 값을
 * 비교하면 그 사이 새 배포가 있었는지 알 수 있다. 로컬(Vercel 환경변수 없음)에서는 항상
 * "dev"라 오탐이 발생하지 않는다.
 */
export function getBuildVersion(): string {
  return process.env.VERCEL_GIT_COMMIT_SHA || "dev";
}
