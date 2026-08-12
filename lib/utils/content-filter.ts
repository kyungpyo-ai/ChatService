/**
 * 금칙어 필터링 유틸
 *
 * 닉네임/방 제목/메시지에서 가장 명백한 부적절 표현(성적 표현, 연락처 유도 등)을
 * 로컬 배열 매칭으로 걸러낸다. 정교한 우회(동음이의어, 자모 분리 등) 탐지는
 * 범위 밖이며, 신고 큐 부담을 줄이는 1차 필터가 목표다(§DEVELOPMENT_PLAN 7.7.3).
 */

const BANNED_WORDS = [
  // 성적 표현
  "섹스",
  "성매매",
  "야동",
  "조건만남",
  "관계하실",
  "1대1야",
  // 연락처 유도(오픈채팅/텔레그램 등 외부 유도)
  "카톡아이디",
  "카톡 아이디",
  "텔레그램",
  "오픈채팅",
  "라인아이디",
  "라인 아이디",
] as const;

/**
 * 입력 텍스트에 금칙어가 포함되어 있는지 확인한다.
 * 공백/대소문자 차이로 인한 우회를 줄이기 위해 공백을 제거하고 소문자로 비교한다.
 */
export function containsBannedWord(text: string): boolean {
  const normalized = text.replace(/\s+/g, "").toLowerCase();
  return BANNED_WORDS.some((word) => normalized.includes(word.replace(/\s+/g, "").toLowerCase()));
}
