import type { Metadata } from "next";
import { exec } from "@/lib/data";
import { REGION_SLUG, formatBudget, typeStyle } from "@/lib/design";
import ExecChart, { type ExecSeries } from "@/components/ExecChart";
import RateBars, { type RateRow } from "@/components/RateBars";
import OrgMonthly from "@/components/OrgMonthly";
import ExecBoard from "@/components/ExecBoard";

export const metadata: Metadata = {
  title: "집행",
  description:
    "예산은 배정된 날이 아니라 나간 날에 일합니다. 청년 세부사업의 돈이 언제, 얼마나 나갔는지 봅니다.",
};

const WEEKDAY = ["월", "화", "수", "목", "금", "토", "일"];

/** 광주·전남은 통합되어 한 행정구역이라 지역 페이지가 따로 없다. */
const NO_PAGE = new Set(["전남광주"]);

export default function ExecPage() {
  const {
    meta, days, daily, cumulative, regions, orgs,
    weekday, months, objects, byType, bySector, orgMonthly, monthMeta,
  } = exec;

  const total: ExecSeries = {
    key: "__all",
    label: "전체",
    budget: meta.budgetTotal,
    executed: meta.executedTotal,
    cumulative,
    programs: meta.programs,
  };

  const regionSeries: ExecSeries[] = regions.map((r) => ({
    key: r.region,
    label: r.region,
    budget: r.budget,
    executed: r.executed,
    cumulative: r.cumulative,
    programs: r.programs,
  }));

  const orgSeries: ExecSeries[] = orgs.slice(0, 24).map((o) => ({
    key: o.org,
    label: o.org,
    sub: o.region,
    budget: o.budget,
    executed: o.executed,
    cumulative: o.cumulative,
    programs: o.programs,
  }));

  const rate = meta.executedTotal / meta.budgetTotal;
  const lastLabel = `${Number(meta.last.slice(4, 6))}월 ${Number(meta.last.slice(6))}일`;

  // 하루에 가장 많이 나간 날들 — 집행이 특정 날짜에 몰리는지 본다.
  const peaks = daily
    .map((v, i) => ({ day: days[i], amount: v }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const weekdayMax = Math.max(...weekday);
  const monthMax = Math.max(...months.map((m) => m.amount));
  const busiest = [...months].sort((a, b) => b.amount - a.amount)[0];
  const monthEndShare = Math.round(
    (objects.monthEnd.amount / meta.executedTotal) * 100,
  );
  // 말일이 몇 번 있었는지는 날짜 목록에서 직접 센다.
  const monthEndDays = days.filter((d) => {
    const y = Number(d.slice(0, 4));
    const m = Number(d.slice(4, 6));
    return Number(d.slice(6)) === new Date(y, m, 0).getDate();
  }).length;
  const monthEndTimes = (
    objects.monthEnd.amount / monthEndDays / (meta.executedTotal / meta.days)
  ).toFixed(1);

  const typeRows: RateRow[] = byType.map((r) => ({
    key: r.type,
    label: r.type,
    budget: r.budget,
    executed: r.executed,
    programs: r.programs,
    color: typeStyle(r.type).fill,
    href: `/fiscal/list?type=${encodeURIComponent(r.type)}`,
  }));
  const slowestType = [...byType].sort(
    (a, b) => a.executed / a.budget - b.executed / b.budget,
  )[0];

  const sectorRows: RateRow[] = bySector.map((r) => ({
    key: r.sector,
    label: r.sector,
    budget: r.budget,
    executed: r.executed,
    programs: r.programs,
    href: `/fiscal/list?sector=${encodeURIComponent(r.sector)}`,
  }));

  const fastest = [...regions].sort((a, b) => b.executed / b.budget - a.executed / a.budget);
  const regionRows: RateRow[] = fastest.map((r) => ({
    key: r.region,
    label: r.region,
    budget: r.budget,
    executed: r.executed,
    programs: r.programs,
    href: NO_PAGE.has(r.region) ? undefined : `/fiscal/region/${REGION_SLUG[r.region]}`,
  }));

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[800px] text-[30px] leading-[1.2] font-bold tracking-[-0.035em] md:text-[38px]">
        예산은 배정된 날이 아니라 나간 날에 일합니다.
      </h1>

      {/* 설명보다 숫자가 먼저 온다. 들어오자마자 답이 보여야 하는 페이지다. */}
      <ExecBoard exec={exec} />

      <p className="mt-10 max-w-[680px] text-[15px] leading-[1.85] text-ink-2">
        지방재정365 세부사업별 세출현황을 매주(6월 10일부터는 매일) 받아 둔 스냅샷에서
        청년 세부사업 {meta.programs.toLocaleString("ko-KR")}건의 누적 지출을 날짜별로 이었습니다.
        온통청년에는 없는 정보 — 청년 예산이 <b className="font-semibold text-ink">언제, 얼마나</b>{" "}
        나갔는지 — 가 여기서 보입니다. 지금까지 예산의 {Math.round(rate * 100)}%가 집행됐습니다.
      </p>

      <div className="mt-8 rounded-[20px] border border-hair bg-card p-6 md:p-8">
        <h2 className="text-[13px] font-semibold text-ink-3">누적 집행률 (6월 이전 주간 · 이후 일별)</h2>
        <p className="mt-1.5 text-[12.5px] text-ink-3">
          선을 훑으면 그날까지의 집행률이 나옵니다. 아래에서 지역을 골라 겹쳐 보세요.
        </p>
        <div className="mt-6">
          <ExecChart days={days} series={regionSeries} total={total} />
        </div>
      </div>


      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">
          무엇이 빨리 나가고 무엇이 남았나
        </h2>
        <p className="mt-2.5 max-w-[680px] text-[14.5px] leading-[1.85] text-ink-2">
          갈래마다 집행 속도가 다릅니다. 가장 느린 것은{" "}
          <b className="font-semibold text-ink">{slowestType.type}</b>으로,
          예산 {formatBudget(slowestType.budget)}원 가운데{" "}
          {Math.round((slowestType.executed / slowestType.budget) * 100)}%만 나갔습니다.
          신청을 받아 나가는 돈은 신청자가 있어야 나가므로, 낮은 집행률이 곧
          게으름은 아니고 수요가 예산만큼은 아니었다는 뜻일 수 있습니다.
        </p>
        <div className="mt-6">
          <RateBars rows={typeRows} />
        </div>
        <p className="mt-3 text-[11.5px] text-ink-3">
          막대의 길이는 예산 크기, 채워진 부분이 집행분입니다. 분야는 사업명으로 추정한 값입니다.
        </p>

        <h3 className="mt-12 text-[15px] font-bold tracking-[-0.02em]">부문별</h3>
        <p className="mt-1.5 max-w-[640px] text-[12.5px] leading-[1.7] text-ink-3">
          예산서가 청년 사업을 넣어 둔 칸으로 갈랐습니다. 예산이 큰 {sectorRows.length}개.
        </p>
        <div className="mt-4">
          <RateBars rows={sectorRows} />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">언제 나가나</h2>
        <p className="mt-2.5 max-w-[680px] text-[14.5px] leading-[1.85] text-ink-2">
          가장 많이 나간 달은 <b className="font-semibold text-ink">{Number(busiest.ym.slice(4))}월</b>로{" "}
          {formatBudget(busiest.amount)}원, 지금까지 집행액의{" "}
          {Math.round((busiest.amount / meta.executedTotal) * 100)}%입니다. 말일에도 몰립니다 —
          한 해 {meta.days}일의 집행일 가운데 말일은 {monthEndDays}일뿐인데 그 하루들이{" "}
          <b className="font-semibold text-ink">{monthEndShare}%</b>를 가져갑니다.
          여느 날의 {monthEndTimes}배입니다.
        </p>
        <p className="mt-3 max-w-[680px] rounded-[14px] border border-dashed border-hair p-4 text-[13px] leading-[1.75] text-ink-2">
          다만 <b className="font-semibold text-ink">연말은 이 자료에 없습니다.</b>{" "}
          {meta.last.slice(0, 4)}년 {Number(meta.last.slice(4, 6))}월 {Number(meta.last.slice(6))}일까지만
          들어와 있어, 흔히 말하는 연말 몰아쓰기가 있었는지 없었는지는 여기서 답할 수
          없습니다. 앞쪽 달이 커 보이는 것도 상당 부분은 그 때문입니다 — 1~6월은
          여섯 달치이고 그 뒤는 두 달 남짓입니다.
        </p>

        <div className="mt-7 rounded-[20px] border border-hair bg-card p-6 md:p-8">
          <h3 className="text-[12px] font-semibold text-ink-3">월별 집행액</h3>
          {/* 좁은 화면에서는 '1,177억' 글자가 칸보다 넓어 밀려 나간다. 밀어 보게 둔다. */}
          <ul className="mt-4 -mx-1 flex items-end gap-2 overflow-x-auto px-1 pb-1 sm:gap-3">
            {months.map((m) => (
              <li
                key={m.ym}
                className="flex w-[52px] shrink-0 flex-col items-center gap-2 sm:w-auto sm:flex-1"
              >
                <span className="tnum text-[11.5px] font-semibold text-ink-2">
                  {formatBudget(m.amount)}
                </span>
                <span
                  className="w-full rounded-t-[3px] bg-t-biz"
                  style={{ height: `${Math.max(4, (m.amount / monthMax) * 130)}px` }}
                  title={`${Number(m.ym.slice(4))}월 ${formatBudget(m.amount)}원`}
                />
                <span className="tnum text-[12px] text-ink-3">{Number(m.ym.slice(4))}월</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11.5px] text-ink-3">
            마지막 달은 {lastLabel}까지만 집계된 것이라 낮게 보입니다.
          </p>
        </div>

        <div className="mt-10 grid gap-12 md:grid-cols-2">
          <div>
            <h3 className="text-[15px] font-bold tracking-[-0.02em]">돈은 평일에만 나갑니다</h3>
            <p className="mt-2 max-w-[520px] text-[13px] leading-[1.75] text-ink-2">
              요일별로 접으면 주말이 0입니다. 자료가 제대로 들어왔다는 뜻이기도 하고,
              집행이 회계 처리일에 찍힌다는 뜻이기도 합니다.
            </p>
            <ul className="mt-5 space-y-2">
              {weekday.map((v, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-[13px] font-semibold text-ink-2">
                    {WEEKDAY[i]}
                  </span>
                  <span className="relative h-5 flex-1 bg-wash">
                    <span
                      className="absolute inset-y-0 left-0 bg-t-biz"
                      style={{ width: `${Math.max(0, (v / weekdayMax) * 100)}%` }}
                    />
                  </span>
                  <span className="tnum w-20 shrink-0 text-right text-[12.5px] text-ink-2">
                    {v >= 1 ? `${formatBudget(v)}원` : "0"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[15px] font-bold tracking-[-0.02em]">하루에 가장 많이 나간 날</h3>
            <p className="mt-2 max-w-[520px] text-[13px] leading-[1.75] text-ink-2">
              집행은 고르게 퍼지지 않습니다. 며칠에 몰리는 돈이 한 해의 모양을 만듭니다.
            </p>
            <ol className="mt-5 border-t border-hair">
              {peaks.map((p) => (
                <li
                  key={p.day}
                  className="flex items-center justify-between gap-4 border-b border-hair py-3"
                >
                  <span className="tnum shrink-0 text-[14px] font-semibold">
                    {Number(p.day.slice(4, 6))}월 {Number(p.day.slice(6))}일
                  </span>
                  <span className="relative mx-3 h-4 flex-1 bg-wash">
                    <span
                      className="absolute inset-y-0 left-0 bg-ink"
                      style={{ width: `${(p.amount / peaks[0].amount) * 100}%` }}
                    />
                  </span>
                  <span className="tnum shrink-0 text-[14px] font-bold">
                    {formatBudget(p.amount)}원
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">지역별</h2>
        <p className="mt-2 max-w-[640px] text-[13.5px] leading-[1.75] text-ink-2">
          같은 {lastLabel}인데 집행률은{" "}
          {Math.round((fastest[0].executed / fastest[0].budget) * 100)}%부터{" "}
          {Math.round(
            (fastest[fastest.length - 1].executed / fastest[fastest.length - 1].budget) * 100,
          )}
          %까지 벌어집니다. 연말에 몰아 쓰는 사업이 있어 낮다고 곧 문제라는 뜻은 아니지만,
          같은 시점의 차이는 그 자체로 정보입니다.
        </p>
        <div className="mt-6">
          <RateBars rows={regionRows} />
        </div>
      </section>

      <OrgMonthly orgs={orgMonthly} months={months} monthMeta={monthMeta} />

      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">지자체별 일별 집행률</h2>
        <p className="mt-2 max-w-[660px] text-[13.5px] leading-[1.75] text-ink-2">
          집행액이 큰 24곳입니다. 아래에서 골라 그래프에 겹치면 그 지자체의 하루하루
          집행률이 선으로 그려집니다. 같은 날 같은 시점인데 선이 얼마나 갈라지는지가
          이 그래프의 요지입니다.
        </p>
        <div className="mt-6 rounded-[20px] border border-hair bg-card p-6 md:p-8">
          <ExecChart days={days} series={orgSeries} total={total} />
        </div>
      </section>


      <div className="mt-16 rounded-[20px] border border-dashed border-hair bg-paper p-6">
        <h2 className="text-[13px] font-semibold text-ink-3">이 화면이 못 하는 것</h2>
        <ul className="mt-3 space-y-2">
          {meta.caveats.map((c) => (
            <li key={c} className="flex gap-2.5 text-[13px] leading-[1.75] text-ink-2">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-10 border-t border-hair pt-6 text-[12px] leading-[1.8] text-ink-3">
        출처 · {meta.source} · {meta.first.slice(0, 4)}.{Number(meta.first.slice(4, 6))}.
        {Number(meta.first.slice(6))} ~ {meta.last.slice(0, 4)}.{Number(meta.last.slice(4, 6))}.
        {Number(meta.last.slice(6))}, 스냅샷 {meta.days}개
      </p>
    </div>
  );
}
