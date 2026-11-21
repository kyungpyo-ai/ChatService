/**
 * 청소년보호정책 페이지
 *
 * 사이트 하단 링크에서 열람한다. 연락처·시행일은 lib/utils/site.ts의 공용 상수를 쓴다.
 */

import type { Metadata } from "next";
import { contactEmail, legalEffectiveDate } from "@/lib/utils/site";

export const metadata: Metadata = {
  title: "청소년보호정책 | 달나루",
};

export default function YouthProtectionPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">청소년보호정책</h1>
      <div className="text-muted-foreground space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">
            1. 청소년유해정보 차단 및 모니터링
          </h2>
          <p>
            서비스는 만 14세 이상만 이용할 수 있으며, 닉네임·방 제목·대화 내용에 대해 부적절한
            표현을 자동으로 걸러내는 필터를 운영하고, 신고된 콘텐츠는 운영팀이 확인 후 조치합니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">2. 신고 채널</h2>
          <p>
            서비스 내 모든 대화방·메시지·사용자 프로필에서 신고 기능을 제공합니다. 접수된 신고는
            관리자 페이지를 통해 우선순위에 따라 처리됩니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">3. 청소년보호책임자</h2>
          <p>
            청소년보호책임자: 달나루 운영자 ·{" "}
            <a href={`mailto:${contactEmail}`} className="text-foreground underline">
              {contactEmail}
            </a>
          </p>
          <p className="mt-2">
            청소년에게 유해한 정보나 청소년을 대상으로 한 만남 유도 등을 발견하면 서비스 내 신고
            기능 또는 위 연락처로 알려주세요. 확인 즉시 해당 콘텐츠를 삭제하고 작성자의 이용을
            제한합니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">4. 시행일</h2>
          <p>본 정책은 {legalEffectiveDate}부터 시행됩니다.</p>
        </section>
      </div>
    </div>
  );
}
