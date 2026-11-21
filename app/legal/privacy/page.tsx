/**
 * 개인정보처리방침 페이지
 *
 * 회원가입 동의 흐름과 사이트 하단 링크에서 열람한다. 보호책임자 연락처·시행일은
 * lib/utils/site.ts의 공용 상수를 쓴다(문서 개정 시 legalEffectiveDate 갱신).
 */

import type { Metadata } from "next";
import { contactEmail, legalEffectiveDate } from "@/lib/utils/site";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 달나루",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">개인정보처리방침</h1>
      <div className="text-muted-foreground space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">
            1. 수집하는 개인정보 항목
          </h2>
          <p>
            이메일, 닉네임, 성별, 나이, 프로필 이미지(선택), 서비스 이용 중 작성한 대화 내용 및
            업로드한 이미지를 수집합니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">
            2. 수집 목적 및 보유 기간
          </h2>
          <p>
            회원 식별, 서비스 제공, 부정 이용 방지 및 신고 처리를 목적으로 수집하며, 회원 탈퇴 시
            관계 법령에서 정한 기간을 제외하고 지체 없이 파기합니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">
            3. 제3자 제공 및 처리위탁
          </h2>
          <p>
            서비스 인프라 운영을 위해 Supabase(데이터베이스·인증·저장소), Vercel(호스팅)에 처리를
            위탁하고 있습니다. 위탁받은 업체는 해외에 서버를 두고 있을 수 있습니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">4. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 본인의 개인정보에 대한 열람, 정정, 삭제를 요청할 수 있으며, 프로필
            화면의 계정 탈퇴 기능을 통해 직접 삭제를 요청할 수도 있습니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">5. 광고 및 쿠키</h2>
          <p>
            서비스는 운영비 충당을 위해 Google AdSense, Kakao AdFit 등 제3자 광고 서비스를 이용할 수
            있습니다. 이들 광고 사업자는 이용자의 관심사에 맞는 광고를 제공하기 위해 쿠키 및 광고
            식별자 등 행태정보를 수집·이용할 수 있으며, 대화 내용 등 서비스 내 작성 정보는 광고
            사업자에게 제공하지 않습니다.
          </p>
          <p className="mt-2">
            이용자는 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있고, Google 맞춤 광고는{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline"
            >
              Google 광고 설정
            </a>
            에서 해제할 수 있습니다. 쿠키 저장을 거부해도 서비스 이용에는 제한이 없습니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">
            6. 개인정보 보호책임자 및 문의처
          </h2>
          <p>
            개인정보 처리에 관한 문의, 열람·정정·삭제 요청, 불만 처리 및 피해 구제는 아래 연락처로
            요청하실 수 있으며, 지체 없이 답변·처리하겠습니다.
          </p>
          <p className="mt-2">
            개인정보 보호책임자: 달나루 운영자 ·{" "}
            <a href={`mailto:${contactEmail}`} className="text-foreground underline">
              {contactEmail}
            </a>
          </p>
          <p className="mt-2">
            기타 개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보침해신고센터(국번 없이 118,
            privacy.kisa.or.kr) 또는 개인정보분쟁조정위원회(1833-6972, www.kopico.go.kr)에 문의하실
            수 있습니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">7. 시행일</h2>
          <p>본 개인정보처리방침은 {legalEffectiveDate}부터 시행됩니다.</p>
        </section>
      </div>
    </div>
  );
}
