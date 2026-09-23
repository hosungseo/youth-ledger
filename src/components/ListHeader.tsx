/**
 * 두 목록이 같은 모양으로 열린다 — 무엇인지, 그리고 반대쪽 장부는 몇 건인지.
 * 넘어가는 것은 헤더 토글이 맡으므로 여기엔 숫자만 둔다.
 */
export default function ListHeader({
  title,
  lede,
  other,
}: {
  title: string;
  lede: string;
  other: { label: string; total: number };
}) {
  return (
    <header className="max-w-[720px]">
      <h1 className="text-[32px] leading-tight font-bold tracking-[-0.035em] md:text-[40px]">
        {title}
      </h1>
      <p className="mt-2.5 text-[14.5px] leading-[1.75] text-ink-2">{lede}</p>
      <p className="mt-3 text-[13px] text-ink-3">
        같은 것을 {other.label}으로 세면{" "}
        <b className="tnum font-semibold text-ink-2">
          {other.total.toLocaleString("ko-KR")}건
        </b>
        입니다.
      </p>
    </header>
  );
}
