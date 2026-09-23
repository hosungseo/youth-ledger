import Link from "next/link";
import { exec, fiscal, fiscalPrograms, meta } from "@/lib/data";
import { TYPE_STYLES, formatBudget } from "@/lib/design";
import Plate, { type Row } from "@/components/matrix/Plate";

export const metadata = {
  title: "판",
  description:
    "예산 자료가 보는 청년 세부사업을 중앙부처와 시도 × 분야로 펼친 판.",
};

export default function FiscalPlatePage() {
  const rows = fiscal.rows as Row[];

  const empties = rows.reduce(
    (n, r) => n + r.cells.filter((c) => c.count === 0).length,
    0,
  );

  const central = fiscalPrograms.filter((p) => p.level === "central");
  const local = fiscalPrograms.filter((p) => p.level === "local");
  const sum = (xs: typeof fiscalPrograms) => xs.reduce((s, p) => s + p.budget, 0);

  const absent = fiscalPrograms.filter((p) => !p.inOnthong);
  const absentCentral = central.filter((p) => !p.inOnthong);
  const est = fiscal.meta.absentEstimate;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[780px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
        예산서가 청년이라 부르는
        <br />
        {fiscal.meta.total.toLocaleString("ko-KR")}건은 어떤 모양인가.
      </h1>

      <p className="mt-5 max-w-[660px] text-[15px] leading-[1.8] text-ink-2">
        지방재정365와 열린재정에서 이름에 청년이 들어간 세부사업을 모은 것입니다.
        온통청년 {meta.total.toLocaleString("ko-KR")}건보다 두 배 넘게 많고, 같은 축으로 펼치면{" "}
        {rows.length * TYPE_STYLES.length}칸 가운데 <b className="font-semibold text-ink">{empties}칸이 비어 있습니다.</b>{" "}
        분야는 예산 자료에 없어 사업명으로 추정한 값입니다.
      </p>

      <div className="mt-12" id="plate">
        <Plate
          data={{
            basis: "fiscal",
            rows,
            note: "가로는 분야 여덟, 세로는 중앙부처와 시도. 예산 자료로 짠 판이라 온통청년 기준보다 훨씬 촘촘합니다. 분야는 사업명으로 추정한 값이니 갈래별 숫자는 그 점을 감안해 보세요.",
          }}
        />
      </div>

      {/* 이 판을 읽기 전에 알아야 할 것. */}
      <section className="mt-14 rounded-[20px] border border-dashed border-hair bg-paper p-7">
        <h2 className="text-[13px] font-semibold text-ink-3">이 가운데 온통청년에 없는 것</h2>
        <p className="mt-3 max-w-[680px] text-[14.5px] leading-[1.85] text-ink-2">
          세부사업마다 같은 지자체·광역이 등록한 온통청년 정책 가운데 이름과 대상 지역이 맞는 것을 찾았습니다.
          자동 판정으로는 <b className="font-semibold text-ink">{absent.length.toLocaleString("ko-KR")}건</b>이
          대응 정책을 찾지 못했습니다.
          {est && (
            <>
              {" "}자동 판정은 틀리기도 하므로 표본 {est.sample}건을 두 검토자가 다시 봤고, 지방 청년 세부사업의{" "}
              <b className="font-semibold text-ink">약 {est.absentShare}%</b>(95% 구간 {est.ci[0]}~{est.ci[1]}%)가
              실제로 온통청년에 없다고 추정했습니다.
            </>
          )}
        </p>
        <p className="mt-3 max-w-[680px] text-[14.5px] leading-[1.85] text-ink-2">
          중앙은 한 건씩 대조했습니다. 청년 세부사업 {central.length}건 가운데{" "}
          <b className="font-semibold text-ink">{absentCentral.length}건 {formatBudget(sum(absentCentral))}원</b>이
          온통청년에 없고, 대부분은 {"'맞춤형 국가장학금'"} 한 사업입니다.
        </p>
        <p className="mt-3 max-w-[680px] text-[14.5px] leading-[1.85] text-ink-2">
          센터 운영비·공간 조성처럼 청년이 직접 신청하지 않는 사업도 섞여 있으니, 목록에서 사업 성격으로 걸러 보세요.
          한 정책을 광역·시군이 나눠 편성하면 세부사업이 여러 건이 되므로 건수 차이가 곧 누락 수는 아닙니다.
        </p>
        <Link
          href="/fiscal/list?onthong=absent"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-onink transition-opacity hover:opacity-90"
        >
          온통청년에 없는 청년 세부사업 목록 →
        </Link>
      </section>

      <section className="mt-14 border-t border-hair pt-10">
        <h2 className="text-[20px] font-bold tracking-[-0.025em]">
          이 판에는 없고 집행에만 있는 것
        </h2>
        <p className="mt-2 max-w-[640px] text-[13.5px] leading-[1.75] text-ink-2">
          예산 자료에는 온통청년에 없는 것이 하나 더 있습니다 — 돈이 실제로 나간 날입니다.
          지방 청년 세부사업 {exec.meta.programs.toLocaleString("ko-KR")}건의 누적 지출을 날짜별로 이으면
          예산 {formatBudget(exec.meta.budgetTotal)}원 가운데{" "}
          {Math.round((exec.meta.executedTotal / exec.meta.budgetTotal) * 100)}%가
          집행됐습니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/fiscal/exec"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-onink transition-opacity hover:opacity-90"
          >
            일별 집행 보기 →
          </Link>
          <Link
            href="/fiscal/sectors"
            className="rounded-full border border-hair bg-card px-5 py-2.5 text-[13.5px] font-semibold text-ink-2 transition-colors hover:bg-wash"
          >
            부문별로 보기
          </Link>
        </div>
      </section>

      <p className="mt-14 border-t border-hair pt-6 text-[12px] leading-[1.8] text-ink-3">
        출처 · {fiscal.meta.source} · 지방 {local.length.toLocaleString("ko-KR")}건, 중앙{" "}
        {central.length}건.{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-ink">
          분류 규칙과 한계
        </Link>
      </p>
    </div>
  );
}
