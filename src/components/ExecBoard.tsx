import Link from "next/link";
import { REGION_SLUG, formatBudget } from "@/lib/design";
import type { ExecData } from "@/lib/types";

/**
 * 집행 상황판. 이 페이지에 들어온 사람이 첫 화면에서 답을 받아야 하는 물음은
 * 하나다 — "지금 얼마나 나갔나". 그래서 설명보다 숫자가 먼저 온다.
 *
 * 아래로 이어지는 절들은 그 숫자를 쪼개는 것이고, 여기서는 쪼개지 않는다.
 */

/** 광주·전남은 통합되어 한 행정구역이라 지역 페이지가 따로 없다. */
const NO_PAGE = new Set(["전남광주"]);

export default function ExecBoard({ exec }: { exec: ExecData }) {
  const { meta, months, monthMeta, byType, regions } = exec;

  const rate = meta.executedTotal / meta.budgetTotal;
  const left = meta.budgetTotal - meta.executedTotal;
  const asOf = `${Number(meta.last.slice(4, 6))}월 ${Number(meta.last.slice(6))}일`;

  const lastFull = months.find((m) => m.ym === monthMeta.lastFullMonth);
  const lastFullLabel = `${Number(monthMeta.lastFullMonth.slice(4))}월`;
  // 그 달에 나간 돈은 곧 그 달에 오른 집행률(%p)이다. 분모가 같기 때문.
  const liftLastMonth = ((lastFull?.amount ?? 0) / meta.budgetTotal) * 100;


  const slowest = [...byType].sort(
    (a, b) => a.executed / a.budget - b.executed / b.budget,
  )[0];

  const ranked = [...regions]
    .map((r) => ({ ...r, rate: r.budget > 0 ? r.executed / r.budget : 0 }))
    .sort((a, b) => b.rate - a.rate);
  const top = ranked[0];
  const bottom = ranked[ranked.length - 1];

  // 경고등: 평균보다 느린데 아직 안 나간 돈이 큰 곳. "느린 게 곧 나쁘다"가 아니라
  // "여기에 돈이 가장 많이 남아 있다"는 뜻이므로 금액 순으로 세운다.
  const pending = ranked
    .map((r) => ({ ...r, left: r.budget - r.executed }))
    .filter((r) => r.rate < rate)
    .sort((a, b) => b.left - a.left)
    .slice(0, 3);

  const stats = [
    {
      label: "아직 안 나간 돈",
      value: formatBudget(left),
      unit: "원",
      note: `예산의 ${Math.round((left / meta.budgetTotal) * 100)}%`,
    },
    {
      label: `${lastFullLabel} 한 달`,
      value: formatBudget(lastFull?.amount ?? 0),
      unit: "원",
      note: "마지막으로 온전히 채워진 달",
    },
    {
      label: "한 푼도 안 나간 사업",
      value: (meta.programs - exec.deptMeta.programsWithExec).toLocaleString("ko-KR"),
      unit: "건",
      note: "예산은 있는데 지출이 0인 청년 세부사업",
    },
    {
      label: "가장 느린 갈래",
      value: String(Math.round((slowest.executed / slowest.budget) * 100)),
      unit: "%",
      note: `${slowest.type} · 예산 ${formatBudget(slowest.budget)}원`,
    },
  ];

  return (
    <section className="mt-8" aria-label="집행 상황판">
      <div className="rounded-[24px] border border-hair bg-card p-7 md:p-10">
        {/* 첫 줄에 답이 있어야 한다. */}
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.04em] text-ink-3">
              청년 세부사업 집행률 · {meta.last.slice(0, 4)}년 {asOf} 기준
            </p>
            {/* 큰 숫자와 증감은 줄바꿈 규칙이 달라 형제로 나란히 둔다.
                한 문단에 섞으면 104px 행간이 증감 두 줄을 깔고 뭉갠다. */}
            <div className="mt-2 flex items-end gap-4">
              <p className="tnum text-[76px] leading-[0.82] font-bold tracking-[-0.055em] md:text-[104px]">
                {Math.round(rate * 100)}
                <span className="text-[30px] font-bold tracking-[-0.03em] md:text-[38px]">%</span>
              </p>
              <p className="pb-2 leading-[1.35]">
                <span className="tnum block text-[15px] font-semibold text-t-biz md:text-[17px]">
                  ▲ {liftLastMonth.toFixed(1)}%p
                </span>
                <span className="block text-[11.5px] text-ink-3">
                  {lastFullLabel} 한 달 동안
                </span>
              </p>
            </div>
          </div>

          <p className="tnum pb-2 text-[15px] leading-[1.7] text-ink-2 md:text-[17px]">
            <b className="font-bold text-ink">{formatBudget(meta.executedTotal)}원</b>
            <span className="mx-2 text-ink-3">/</span>
            {formatBudget(meta.budgetTotal)}원
            <span className="mt-1 block text-[12.5px] text-ink-3">
              지방 청년 세부사업 {meta.programs.toLocaleString("ko-KR")}건 · 중앙은 이 화면에서 제외
            </span>
          </p>
        </div>

        {/* 한 줄짜리 진행 막대. 눈금이 있어야 60%가 어디쯤인지 읽힌다. */}
        <div className="mt-7">
          <div className="relative h-11 w-full overflow-hidden rounded-[8px] bg-wash">
            <div
              className="absolute inset-y-0 left-0 bg-t-biz"
              style={{ width: `${Math.min(100, rate * 100)}%` }}
            />
            {[25, 50, 75].map((g) => (
              <span
                key={g}
                className="absolute inset-y-0 w-px bg-ink/20"
                style={{ left: `${g}%` }}
                aria-hidden
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
            {[0, 25, 50, 75, 100].map((g) => (
              <span key={g} className="tnum">
                {g}%
              </span>
            ))}
          </div>
        </div>

        <dl className="mt-8 grid gap-x-8 gap-y-6 border-t border-hair pt-7 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-[12px] font-semibold text-ink-3">{s.label}</dt>
              <dd className="tnum mt-1.5 text-[30px] leading-none font-bold tracking-[-0.03em]">
                {s.value}
                <span className="ml-0.5 text-[15px] font-semibold text-ink-2">{s.unit}</span>
              </dd>
              <dd className="mt-1.5 text-[12px] leading-[1.5] text-ink-3">{s.note}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 같은 날짜인데 지역마다 이만큼 갈린다 — 상황판에서 가장 먼저 보여야 할 편차. */}
      <div className="mt-4 rounded-[24px] border border-hair bg-card p-7 md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[13px] font-semibold text-ink-3">시도별 집행률</h2>
          <p className="text-[12.5px] text-ink-2">
            같은 {asOf}인데 <b className="font-semibold text-ink">{top.region} {Math.round(top.rate * 100)}%</b>
            부터 <b className="font-semibold text-ink">{bottom.region} {Math.round(bottom.rate * 100)}%</b>
            까지 벌어집니다.
          </p>
        </div>

        {/* 전국 평균선. 막대만 늘어놓으면 "높다/낮다"의 기준이 없다. */}
        <div className="relative mt-6">
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-ink/45"
            style={{ bottom: `${28 + rate * 110}px` }}
            aria-hidden
          >
            <span className="tnum absolute right-0 -top-[15px] bg-card px-1 text-[10.5px] font-semibold text-ink-2">
              전국 {Math.round(rate * 100)}%
            </span>
          </div>
          <ul className="-mx-1 flex items-end gap-1.5 overflow-x-auto px-1 pb-1 sm:gap-2">
          {ranked.map((r) => {
            const pct = Math.round(r.rate * 100);
            const below = r.rate < rate;
            const cell = (
              <>
                <span className={`tnum text-[11.5px] font-bold ${below ? "text-ink-2" : ""}`}>
                  {pct}
                </span>
                {/* 평균 위는 채우고, 아래는 테두리만 — 색이 아니라 밀도로 가른다. */}
                <span
                  className={`w-full rounded-t-[3px] transition-opacity group-hover:opacity-80 ${
                    below ? "border border-b-0 border-t-biz bg-t-biz/20" : "bg-t-biz"
                  }`}
                  style={{ height: `${Math.max(4, r.rate * 110)}px` }}
                />
                <span className="truncate text-[11px] text-ink-3">{r.region}</span>
              </>
            );
            const cls = "group flex flex-1 flex-col items-center gap-1.5 text-center";
            return (
              <li key={r.region} className="flex w-[42px] shrink-0 flex-col sm:w-auto sm:flex-1">
                {NO_PAGE.has(r.region) ? (
                  <span className={cls} title={`${r.region} ${pct}%`}>
                    {cell}
                  </span>
                ) : (
                  <Link
                    href={`/fiscal/region/${REGION_SLUG[r.region]}`}
                    className={cls}
                    title={`${r.region} ${pct}% — 지역 페이지로`}
                  >
                    {cell}
                  </Link>
                )}
              </li>
            );
            })}
          </ul>
        </div>

        {pending.length > 0 && (
          <div className="mt-7 border-t border-hair pt-6">
            <h3 className="text-[12px] font-semibold text-ink-3">
              남은 돈이 가장 많은 곳 · 전국 평균보다 느린 시도 가운데
            </h3>
            <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-3">
              {pending.map((r) => (
                <li key={r.region} className="flex items-baseline gap-2.5">
                  <span
                    className="mt-[6px] h-2 w-2 shrink-0 rounded-full bg-t-biz"
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="text-[14px] font-semibold">{r.region}</span>
                    <span className="tnum ml-2 text-[13px] text-ink-2">
                      {formatBudget(r.left)}원 남음
                    </span>
                    <span className="tnum mt-0.5 block text-[11.5px] text-ink-3">
                      집행 {Math.round(r.rate * 100)}% · 예산 {formatBudget(r.budget)}원
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11.5px] leading-[1.6] text-ink-3">
              연말에 몰아 쓰는 사업이 있어 느린 것이 곧 문제라는 뜻은 아닙니다. 다만
              남은 예산이 어디에 쏠려 있는지는 그 자체로 정보입니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
