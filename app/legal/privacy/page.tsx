/**
 * 개인정보처리방침 페이지
 *
 * 실제 문구는 법률 검토 후 확정된다(§DEVELOPMENT_PLAN 7.7.2). 지금은 회원가입 동의
 * 흐름에서 링크로 열람 가능하도록 골격만 마련한다.
 */

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
        <p className="text-xs">본 방침은 초안이며, 법률 검토를 거쳐 최종 확정됩니다.</p>
      </div>
    </div>
  );
}
