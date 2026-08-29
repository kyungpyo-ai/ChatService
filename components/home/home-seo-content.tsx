const HIGHLIGHTS = [
  {
    title: "로그인 없이 바로 랜덤채팅",
    body: "회원가입 없이도 무료 랜덤채팅으로 처음 보는 사람과 바로 대화를 시작할 수 있어요.",
  },
  {
    title: "관심사로 모이는 채팅방",
    body: "취미, 지역, 관심사가 맞는 사람들과 함께할 오픈 채팅방을 직접 만들거나 찾아서 참여해요.",
  },
  {
    title: "기록이 남지 않는 익명채팅",
    body: "대화가 끝나면 내용이 남지 않아 부담 없이 익명으로 편하게 이야기할 수 있어요.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "달나루는 회원가입 없이도 사용할 수 있나요?",
    answer:
      "네, 랜덤채팅은 로그인 없이 바로 이용할 수 있어요. 방채팅 참여나 사용자 검색처럼 일부 기능만 로그인이 필요해요.",
  },
  {
    question: "채팅 내용이 저장되나요?",
    answer: "지나간 랜덤채팅 대화는 저장되지 않아 아무에게도 남지 않아요.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

/**
 * 홈 CTA 하단 검색엔진 크롤링용 소개/FAQ 콘텐츠. 화면 하단부라 최초 노출 UX에는
 * 영향을 주지 않으면서, 검색엔진에 노출될 텍스트 콘텐츠와 FAQPage 구조화 데이터를 제공한다.
 */
export function HomeSeoContent() {
  return (
    <section className="space-y-8 pt-4">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">달나루, 이런 분께 추천해요</h2>
        <ul className="space-y-3">
          {HIGHLIGHTS.map(({ title, body }) => (
            <li key={title} className="space-y-0.5">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-muted-foreground text-sm text-pretty">{body}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">자주 묻는 질문</h2>
        <dl className="space-y-3">
          {FAQ_ITEMS.map(({ question, answer }) => (
            <div key={question} className="space-y-0.5">
              <dt className="text-sm font-medium">{question}</dt>
              <dd className="text-muted-foreground text-sm text-pretty">{answer}</dd>
            </div>
          ))}
        </dl>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
}
