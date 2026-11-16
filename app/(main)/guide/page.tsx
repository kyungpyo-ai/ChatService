import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "랜덤채팅 이용 가이드 — 무료 익명채팅 시작하는 법 | 달나루",
  description:
    "로그인 없이 무료로 즐기는 랜덤채팅, 관심사로 모이는 방채팅까지. 달나루 익명채팅을 처음 이용하는 분을 위한 사용법과 안전수칙을 정리했어요.",
  alternates: { canonical: "/guide" },
};

const SECTIONS = [
  {
    title: "1. 로그인 없이 바로 시작하는 랜덤채팅",
    paragraphs: [
      "달나루의 랜덤채팅은 회원가입이나 로그인 없이 바로 이용할 수 있는 무료 익명채팅이에요. 랜덤채팅 화면에서 시작 버튼을 누르면 지금 대화 상대를 기다리는 사람과 자동으로 1:1로 연결돼요.",
      "대화가 마음에 들지 않으면 언제든 대화를 끝내고 새로운 상대를 다시 찾을 수 있어요. 닉네임이나 프로필을 만들 필요가 없어서 처음 보는 사람과도 부담 없이 이야기를 나눌 수 있어요.",
    ],
  },
  {
    title: "2. 관심사가 맞는 사람과 모이는 방채팅",
    paragraphs: [
      "여러 사람과 함께 이야기하고 싶다면 방채팅을 이용해보세요. 방 목록에서 마음에 드는 오픈 채팅방에 참여하거나, 원하는 주제로 직접 채팅방을 만들 수 있어요.",
      "채팅방은 최대 인원(2~50명)을 정할 수 있고, 아는 사람끼리만 대화하고 싶다면 비밀번호를 걸어 비공개 방으로 만들 수도 있어요. 방채팅은 로그인한 회원만 이용할 수 있어요.",
      "방 목록에는 방장이나 참여자 중 한 명이라도 달나루에 접속해 있는 방만 보여요. 아무도 접속해 있지 않은 방은 잠시 목록에서 숨겨질 뿐 사라진 것이 아니라서, 누군가 다시 접속하면 다시 나타나요. 내가 참여 중인 방은 '내가 참여중인 방' 탭에서 언제든 확인할 수 있어요.",
    ],
  },
  {
    title: "3. 회원이 되면 더 할 수 있는 것",
    paragraphs: [
      "회원가입을 하면 방채팅 외에도 닉네임으로 다른 사용자를 찾는 검색, 마음에 드는 상대에게 메시지를 남기는 쪽지, 사람찾기·건의사항을 나누는 게시판을 이용할 수 있어요.",
    ],
  },
  {
    title: "4. 안전하게 채팅하기 위한 수칙",
    paragraphs: [
      "익명채팅이라도 실명, 연락처, 주소, 학교·직장 같은 개인정보는 함부로 알려주지 마세요. 처음 만난 상대가 외부 메신저로 옮기자고 하거나 금전을 요구한다면 대화를 끝내는 것이 안전해요.",
      "욕설, 음란한 대화, 불쾌한 행동을 하는 상대는 대화 화면의 신고 기능으로 알려주세요. 접수된 신고는 운영팀이 확인한 뒤 이용 정지 등의 조치를 해요. 달나루는 만 14세 이상만 이용할 수 있어요.",
    ],
  },
] as const;

/**
 * 랜덤채팅 이용 가이드 — 검색엔진이 읽을 텍스트 콘텐츠가 부족한 채팅 서비스 특성상,
 * "랜덤채팅/익명채팅/무료 채팅" 검색어로 노출될 수 있도록 서비스 사용법을 글로 풀어둔 페이지.
 */
export default function GuidePage() {
  return (
    <article className="animate-page-fade-in mx-auto max-w-2xl space-y-8 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold">랜덤채팅 이용 가이드</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          달나루는 로그인 없는 무료 랜덤채팅과 관심사로 모이는 방채팅을 함께 즐길 수 있는 익명채팅
          서비스예요. 처음 오셨다면 아래 내용을 먼저 읽어보세요.
        </p>
      </header>

      {SECTIONS.map(({ title, paragraphs }) => (
        <section key={title} className="space-y-2">
          <h2 className="text-base font-semibold">{title}</h2>
          {paragraphs.map((text) => (
            <p key={text} className="text-muted-foreground text-sm leading-relaxed text-pretty">
              {text}
            </p>
          ))}
        </section>
      ))}

      <footer className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
        <Link href="/random" className="text-primary hover:underline">
          랜덤채팅 시작하기 →
        </Link>
        <Link href="/faq" className="text-primary hover:underline">
          자주 묻는 질문 보기 →
        </Link>
      </footer>
    </article>
  );
}
