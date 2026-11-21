import type { Metadata } from "next";
import Link from "next/link";
import { contactEmail } from "@/lib/utils/site";

export const metadata: Metadata = {
  title: "서비스 소개 — 달나루는 어떤 곳인가요 | 달나루",
  description:
    "달나루는 로그인 없는 익명 랜덤채팅과 관심사로 모이는 방채팅을 제공하는 웹 채팅 커뮤니티예요. 운영 원칙과 안전 수칙, 문의처를 안내합니다.",
  alternates: { canonical: "/about" },
};

const SECTIONS = [
  {
    title: "달나루는 이런 서비스예요",
    paragraphs: [
      "달나루는 처음 만나는 사람과 가볍게 이야기를 나눌 수 있는 웹 채팅 커뮤니티예요. 앱을 설치하지 않아도 PC와 모바일 브라우저에서 바로 이용할 수 있어요.",
      "로그인 없이 바로 시작하는 1:1 익명 랜덤채팅, 원하는 주제로 직접 만들고 참여하는 방채팅을 중심으로, 회원을 위한 게시판·쪽지·사용자 검색 기능을 함께 제공하고 있어요.",
    ],
  },
  {
    title: "이런 대화를 위해 만들었어요",
    paragraphs: [
      "퇴근길에 잠깐 수다를 떨고 싶을 때, 요즘 본 드라마나 영화 이야기를 나눌 사람이 필요할 때, 고민을 부담 없이 털어놓고 싶을 때처럼 일상 속 가벼운 대화를 위한 공간이에요.",
      "닉네임 외에 실명이나 연락처를 요구하지 않아서, 서로를 배려하는 선에서 편하게 이야기할 수 있어요.",
    ],
  },
  {
    title: "운영 원칙",
    paragraphs: [
      "달나루는 만 14세 이상만 이용할 수 있으며, 회원가입 시 이용약관·개인정보처리방침 동의와 연령 정보 입력을 거쳐요.",
      "음란·불법·혐오 표현, 청소년을 대상으로 한 만남 유도, 광고·스팸, 다른 이용자를 괴롭히는 행위는 허용하지 않아요. 부적절한 닉네임과 방 제목은 금칙어 필터로 걸러지고, 운영자가 대화방과 게시물을 꾸준히 점검해 위반 콘텐츠를 삭제하고 작성자의 이용을 제한해요.",
      "모든 대화방과 메시지에는 신고 기능이 있어요. 접수된 신고는 운영자가 직접 확인하고 처리해요.",
    ],
  },
] as const;

const SAFETY_TIPS = [
  "전화번호, 주소, 학교·직장, SNS 계정, 얼굴이 나온 사진 같은 개인정보는 공유하지 마세요.",
  "대화 상대가 금전 거래, 투자, 상품 구매를 권하거나 다른 메신저·사이트로 옮기자고 하면 응하지 마세요.",
  "처음 만난 사람과의 오프라인 만남은 위험할 수 있어요. 특히 미성년자에게 만남을 제안하는 행위는 법으로 금지되어 있어요.",
  "불쾌하거나 위험하다고 느껴지면 바로 대화를 종료하고, 신고 버튼으로 알려주세요.",
] as const;

/**
 * 서비스 소개 — 운영 주체·운영 원칙·안전 수칙·문의처를 한 페이지에 모은 공개 페이지.
 * 광고 네트워크 심사(운영자 연락처·직접 작성한 콘텐츠 확인)와 검색 노출을 위해 만들었다.
 */
export default function AboutPage() {
  return (
    <article className="animate-page-fade-in mx-auto max-w-2xl space-y-8 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-xl font-bold">달나루 서비스 소개</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          새로운 사람과의 가벼운 대화, 달나루에서 안전하고 편하게 시작해보세요.
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

      <section className="space-y-2">
        <h2 className="text-base font-semibold">안전하게 대화하는 방법</h2>
        <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          {SAFETY_TIPS.map((tip) => (
            <li key={tip} className="text-pretty">
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">문의</h2>
        <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
          서비스 이용 문의, 신고, 제휴 제안은{" "}
          <a href={`mailto:${contactEmail}`} className="text-foreground underline">
            {contactEmail}
          </a>
          로 보내주세요. 운영 정책은{" "}
          <Link href="/legal/terms" className="text-foreground underline">
            이용약관
          </Link>
          ,{" "}
          <Link href="/legal/privacy" className="text-foreground underline">
            개인정보처리방침
          </Link>
          ,{" "}
          <Link href="/legal/youth-protection" className="text-foreground underline">
            청소년보호정책
          </Link>
          에서 확인할 수 있어요.
        </p>
      </section>

      <footer className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
        <Link href="/random" className="text-primary hover:underline">
          랜덤채팅 시작하기 →
        </Link>
        <Link href="/guide" className="text-primary hover:underline">
          이용 가이드 보기 →
        </Link>
      </footer>
    </article>
  );
}
