import { UserRound, LogIn } from "lucide-react";

const ACCESS_INFO = [
  { icon: UserRound, text: "로그인 없이 랜덤채팅 가능" },
  { icon: LogIn, text: "로그인하면 방채팅과 사용자 검색 이용 가능" },
] as const;

/**
 * 홈 AD 배너 하단, 게스트/회원 이용 범위 안내 2줄 리스트
 */
export function AccessInfoList() {
  return (
    <ul className="text-muted-foreground space-y-2 px-1 text-xs">
      {ACCESS_INFO.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2">
          <Icon size={14} />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}
