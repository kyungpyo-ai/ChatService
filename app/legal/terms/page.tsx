/**
 * 이용약관 페이지
 *
 * 실제 문구는 법률 검토 후 확정된다(§DEVELOPMENT_PLAN 7.7.2). 지금은 회원가입 동의
 * 흐름에서 링크로 열람 가능하도록 골격만 마련한다.
 */

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">이용약관</h1>
      <div className="text-muted-foreground space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">제1조 (목적)</h2>
          <p>
            이 약관은 달나루(이하 &quot;서비스&quot;)의 이용조건 및 절차, 이용자와 서비스 운영자의
            권리·의무·책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">제2조 (이용 자격)</h2>
          <p>
            서비스는 만 14세 이상만 이용할 수 있습니다. 회원가입 시 입력한 나이 정보가 사실과 다를
            경우 서비스 이용이 제한될 수 있습니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">
            제3조 (게시물의 권리·책임)
          </h2>
          <p>
            이용자가 서비스 내에서 작성한 대화 및 업로드한 이미지에 대한 권리와 책임은 해당 이용자
            본인에게 있습니다. 서비스 운영자는 법령에 따른 요청이 있는 경우를 제외하고 게시물 내용에
            개입하지 않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">제4조 (이용 제한)</h2>
          <p>
            신고 접수, 부적절한 콘텐츠 게시, 타 이용자에 대한 위해 행위 등이 확인될 경우 서비스
            운영자는 사전 통지 없이 해당 이용자의 서비스 이용을 일시 정지하거나 계정을 제한할 수
            있습니다.
          </p>
        </section>
        <section>
          <h2 className="text-foreground mb-2 text-base font-semibold">제5조 (수사기관 협조)</h2>
          <p>
            서비스 운영자는 관계 법령에 근거한 수사기관의 적법한 요청이 있는 경우 필요한 범위 내에서
            자료를 제공할 수 있습니다.
          </p>
        </section>
        <p className="text-xs">본 약관은 초안이며, 법률 검토를 거쳐 최종 확정됩니다.</p>
      </div>
    </div>
  );
}
