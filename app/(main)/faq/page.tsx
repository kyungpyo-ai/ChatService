import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "자주 묻는 질문 — 랜덤채팅·익명채팅 FAQ | 달나루",
  description:
    "달나루 랜덤채팅은 정말 무료인가요? 로그인 없이 쓸 수 있나요? 대화 내용은 남나요? 익명채팅 이용 전 궁금한 점을 모았어요.",
  alternates: { canonical: "/faq" },
};

const FAQ_ITEMS = [
  {
    question: "달나루 랜덤채팅은 무료인가요?",
    answer: "네, 랜덤채팅과 방채팅을 포함한 모든 채팅 기능을 무료로 이용할 수 있어요.",
  },
  {
    question: "회원가입이나 로그인 없이도 채팅할 수 있나요?",
    answer:
      "랜덤채팅은 로그인 없이 바로 이용할 수 있어요. 방채팅, 사용자 검색, 쪽지, 게시판 글쓰기는 회원가입 후 이용할 수 있어요.",
  },
  {
    question: "랜덤채팅 상대는 어떻게 정해지나요?",
    answer:
      "시작 버튼을 누르면 같은 시간에 대화 상대를 기다리는 사람과 자동으로 1:1 연결돼요. 대화를 끝내면 언제든 새로운 상대를 다시 찾을 수 있어요.",
  },
  {
    question: "대화 내용이 남나요?",
    answer:
      "아니요, 지나간 대화는 아무에게도 남지 않아요. 대화가 끝나면 채팅 화면에서 사라져 상대방이나 다른 사용자가 다시 볼 수 없으니 부담 없이 이야기하세요.",
  },
  {
    question: "채팅방은 어떻게 만드나요?",
    answer:
      "로그인 후 방 목록에서 방 만들기를 누르고 방 제목(최대 50자)과 최대 인원(2~50명)을 정하면 바로 채팅방이 열려요. 1:1로 조용히 이야기하고 싶다면 2명, 여럿이 함께 떠들고 싶다면 인원을 넉넉하게 정해보세요.",
  },
  {
    question: "채팅방은 몇 개까지 만들 수 있나요?",
    answer:
      "한 사람이 동시에 최대 3개의 채팅방을 운영할 수 있어요. 더 만들고 싶다면 기존 방에서 나가 방을 정리한 뒤 새로 만들면 돼요.",
  },
  {
    question: "만든 채팅방이 방 목록에서 안 보여요.",
    answer:
      "방 목록에는 방장이나 참여자 중 한 명이라도 달나루에 접속해 있는 방만 보여요. 아무도 접속해 있지 않은 방은 목록에서 잠시 숨겨질 뿐 사라진 것이 아니라서, 누군가 다시 접속하면 목록에 다시 나타나요. 내가 참여 중인 방은 방 목록의 '내가 참여중인 방' 탭에서 언제든 확인할 수 있어요.",
  },
  {
    question: "아는 사람끼리만 대화하는 비공개 채팅방도 만들 수 있나요?",
    answer:
      "네, 방을 만들 때 비공개로 설정하고 비밀번호(4~20자)를 정하면 비밀번호를 아는 사람만 들어올 수 있어요. 비공개 방도 방 목록에는 보이지만 입장할 때 비밀번호를 입력해야 해요.",
  },
  {
    question: "방장은 무엇을 할 수 있나요?",
    answer:
      "방을 만든 사람이 방장이 되고, 대화 분위기를 흐리는 참여자를 강퇴할 수 있어요. 방장이 방에서 나가면 채팅방은 사라지고 그동안의 대화도 함께 없어져요.",
  },
  {
    question: "채팅방에서 사진도 보낼 수 있나요?",
    answer: "네, 방채팅과 랜덤채팅 모두 대화 중에 사진을 보낼 수 있어요.",
  },
  {
    question: "몇 살부터 이용할 수 있나요?",
    answer: "달나루는 만 14세 이상만 이용할 수 있어요.",
  },
] as const;

// 검색 결과에 질문/답변이 펼쳐져 보일 수 있도록 FAQPage 구조화 데이터를 함께 제공한다.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

export default function FaqPage() {
  return (
    <article className="animate-page-fade-in mx-auto max-w-2xl space-y-8 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold">자주 묻는 질문</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          달나루 랜덤채팅과 익명채팅을 이용하기 전에 많이 궁금해하시는 내용을 모았어요.
        </p>
      </header>

      <dl className="space-y-6">
        {FAQ_ITEMS.map(({ question, answer }) => (
          <div key={question} className="space-y-1">
            <dt className="text-base font-semibold">{question}</dt>
            <dd className="text-muted-foreground text-sm leading-relaxed text-pretty">{answer}</dd>
          </div>
        ))}
      </dl>

      <footer className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
        <Link href="/random" className="text-primary hover:underline">
          랜덤채팅 시작하기 →
        </Link>
        <Link href="/guide" className="text-primary hover:underline">
          이용 가이드 보기 →
        </Link>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </article>
  );
}
