export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-(--radius-card) border p-6 shadow-(--shadow-card)">
          <div className="mb-4 space-y-1">
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              가입해주셔서 감사합니다!
            </h1>
            <p className="text-muted-foreground text-sm">이메일을 확인해주세요</p>
          </div>
          <p className="text-muted-foreground text-sm">
            회원가입이 완료되었습니다. 로그인하기 전에 이메일을 확인해서 계정을 인증해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
