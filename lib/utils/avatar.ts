/**
 * 닉네임(username)을 시드로 항상 같은 배경색을 골라주는 유틸.
 * username은 unique 제약이 있어 사용자별로 색이 고정된다.
 */
const AVATAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-pink-500",
  "bg-rose-500",
] as const;

export function getAvatarColorClass(seed: string | null | undefined): string {
  const key = seed && seed.length > 0 ? seed : "?";
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
