/**
 * 청소년보호정책 페이지
 *
 * 실제 문구·연락처는 운영 결정 및 법률 검토 후 확정된다(§DEVELOPMENT_PLAN 7.7.2, 7.7.4).
 */

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
          <p>이름 및 연락처: 추후 공지 (운영 결정 사항)</p>
        </section>
        <p className="text-xs">
          본 정책은 초안이며, 법률 검토 및 운영 결정을 거쳐 최종 확정됩니다.
        </p>
      </div>
    </div>
  );
}
