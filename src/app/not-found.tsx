import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[680px] flex-col justify-center px-5 py-16">
      <p className="text-[13px] font-semibold text-ink-3">404</p>
      <h1 className="mt-2 text-[30px] font-bold tracking-[-0.03em]">찾는 페이지가 없습니다.</h1>
      <p className="mt-3 text-[15px] leading-[1.8] text-ink-2">
        주소가 바뀌었거나 자료를 다시 모으면서 정책 번호가 달라졌을 수 있습니다. 목록이나 검색에서 다시 찾아 주세요.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/" className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-onink">
          처음으로
        </Link>
        <Link href="/notice/list" className="rounded-full border border-hair bg-card px-5 py-2.5 text-[14px] font-semibold text-ink-2">
          정책 목록
        </Link>
        <Link href="/fiscal/list" className="rounded-full border border-hair bg-card px-5 py-2.5 text-[14px] font-semibold text-ink-2">
          세부사업 목록
        </Link>
      </div>
    </main>
  );
}
