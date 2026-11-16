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
      "로그인 후 방 목록에서 방 만들기를 누르면 제목과 최대 인원(2~50명)을 정해 채팅방을 만들 수 있어요. 비밀번호를 설정해 비공개 방으로 만들 수도 있어요.",
  },
  {
    question: "몇 살부터 이용할 수 있나요?",
    answer: "달나루는 만 14세 이상만 이용할 수 있어요.",
  },
  {
    question: "불쾌한 상대를 만나면 어떻게 하나요?",
    answer:
      "대화 화면의 신고 기능으로 알려주세요. 운영팀이 신고 내용을 확인한 뒤 이용 정지 등의 조치를 해요. 개인정보나 금전을 요구하는 상대와는 바로 대화를 끝내는 것이 안전해요.",
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
