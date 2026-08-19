export default async function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="bg-surface rounded-(--radius-card) border p-6 shadow-(--shadow-card)">
          <h1 className="mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            문제가 발생했습니다
          </h1>
          {params?.error ? (
            <p className="text-muted-foreground text-sm">오류 코드: {params.error}</p>
          ) : (
            <p className="text-muted-foreground text-sm">알 수 없는 오류가 발생했습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
