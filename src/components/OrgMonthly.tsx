"use client";

import { useMemo, useState } from "react";
import { formatBudget, josa } from "@/lib/design";
import type { ExecOrgMonthly } from "@/lib/types";

/**
 * 어느 달에 어느 지자체가 집행률을 얼마나 밀어 올렸나.
 *
 * 상승폭은 그 달에 나간 돈을 그 지자체 예산으로 나눈 값(%p)이다. 누적 집행률은
 * 큰 곳이 늘 앞에 서지만, 상승폭은 "이번 달에 실제로 움직인 곳"을 보여 준다.
 *
 * 예산 하한을 두는 이유: 예산 2억짜리가 한 건 집행하면 +50%p가 찍힌다. 숫자는
 * 맞지만 순위로서는 무의미하다. 기본값을 두되 풀 수 있게 남겨 둔다.
 */
const FLOORS = [
  { v: 10, label: "10억 이상" },
  { v: 50, label: "50억 이상" },
  { v: 0, label: "전체" },
];

const monthLabel = (ym: string) => `${Number(ym.slice(4))}월`;

export default function OrgMonthly({
  orgs,
  months,
  monthMeta,
}: {
  orgs: ExecOrgMonthly[];
  months: { ym: string; amount: number }[];
  monthMeta: { last: string; lastFullMonth: string; partialDays: number };
}) {
  // 마지막 달은 자료가 중간에 끊겨 있다. 기본값은 온전히 채워진 마지막 달.
  const [ym, setYm] = useState(monthMeta.lastFullMonth);
  const [floor, setFloor] = useState(10);

  const idx = months.findIndex((m) => m.ym === ym);
  const partial = ym === monthMeta.last;

  const ranked = useMemo(() => {
    return orgs
      .filter((o) => o.budget >= Math.max(floor, 0.1))
      .map((o) => {
        const spent = o.months[idx] ?? 0;
        return {
          ...o,
          spent,
          lift: (spent / o.budget) * 100,
          rate: (o.executed / o.budget) * 100,
        };
      })
      .sort((a, b) => b.lift - a.lift);
  }, [orgs, idx, floor]);

  const shown = ranked.slice(0, 15);
  const idle = ranked.filter((o) => o.spent <= 0).length;
  const monthTotal = months[idx]?.amount ?? 0;
  const maxLift = Math.max(1, ...shown.map((o) => o.lift));

  return (
    <section className="mt-16">
      <h2 className="text-[22px] font-bold tracking-[-0.025em]">
        그 달에 집행률을 밀어 올린 곳
      </h2>
      <p className="mt-2.5 max-w-[700px] text-[14.5px] leading-[1.85] text-ink-2">
        누적 집행률만 보면 큰 지자체가 늘 앞에 섭니다. 대신 한 달 동안 집행률이{" "}
        <b className="font-semibold text-ink">몇 %p 올랐는지</b>로 세우면, 그달에 실제로
        움직인 곳이 드러납니다. 지자체{" "}
        <b className="font-semibold text-ink">{orgs.length}곳</b>을 모두 놓고 잰 값입니다.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-2">
        {months.map((m) => {
          const on = m.ym === ym;
          const isLast = m.ym === monthMeta.last;
          return (
            <button
              key={m.ym}
              type="button"
              onClick={() => setYm(m.ym)}
              aria-pressed={on}
              title={isLast ? `${monthMeta.partialDays}일치만 들어와 있습니다` : undefined}
              className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                on
                  ? "border-ink bg-ink font-semibold text-onink"
                  : "border-hair bg-card text-ink-2 hover:bg-wash"
              }`}
            >
              {monthLabel(m.ym)}
              {isLast && <span className="ml-1 opacity-60">*</span>}
            </button>
          );
        })}

        <span className="ml-3 flex items-center gap-1.5">
          {FLOORS.map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setFloor(f.v)}
              aria-pressed={floor === f.v}
              className={`rounded-full px-2.5 py-1 text-[12px] transition-colors ${
                floor === f.v ? "bg-wash-2 font-semibold text-ink" : "text-ink-3 hover:bg-wash"
              }`}
            >
              예산 {f.label}
            </button>
          ))}
        </span>
      </div>

      {partial && (
        <p className="mt-4 max-w-[700px] rounded-[14px] border border-dashed border-hair p-4 text-[13px] leading-[1.75] text-ink-2">
          <b className="font-semibold text-ink">{monthLabel(ym)}은 {monthMeta.partialDays}일치뿐입니다.</b>{" "}
          자료가 {monthMeta.last.slice(0, 4)}년 {Number(monthMeta.last.slice(4, 6))}월{" "}
          {monthMeta.partialDays}일까지만 들어와 있어, 이 달의 순위는 아직 한 달을 말하지
          않습니다. 다른 달과 나란히 놓고 보지 마세요.
        </p>
      )}

      <p className="mt-5 text-[13px] text-ink-2">
        {monthLabel(ym)}에 전국에서 {formatBudget(monthTotal)}원이 나갔습니다.
        {shown.length > 0 && (
          <>
            {" "}가장 많이 올린 곳은{" "}
            <b className="font-semibold text-ink">{shown[0].org}</b>
            {josa(shown[0].org, "으로로")}{" "}
            <b className="font-semibold text-ink">+{shown[0].lift.toFixed(1)}%p</b>입니다.
          </>
        )}
        {idle > 0 && (
          <>
            {" "}같은 달에 한 푼도 나가지 않은 곳이 — 지금 걸러 놓은{" "}
            {ranked.length}곳 가운데 — <b className="font-semibold text-ink">{idle}곳</b>{" "}
            있습니다.
          </>
        )}
      </p>

      <ol className="mt-5 border-t border-hair">
        {shown.map((o, i) => (
          <li
            key={o.org}
            className="grid grid-cols-[2rem_1fr_5.5rem_4.5rem] items-center gap-3 border-b border-hair py-3 md:grid-cols-[2rem_11rem_1fr_5.5rem_4.5rem] md:gap-4"
          >
            <span className="tnum text-[11.5px] text-ink-3">
              {String(i + 1).padStart(2, "0")}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold">{o.org}</span>
              <span className="tnum mt-0.5 block text-[11.5px] text-ink-3">
                예산 {formatBudget(o.budget)}원 · 누적 {Math.round(o.rate)}%
              </span>
            </span>

            {/* 이 달에 얼마나 밀었는지의 길이 비교 */}
            <span className="hidden md:block">
              <span className="relative block h-4 bg-wash">
                <span
                  className="absolute inset-y-0 left-0 bg-t-biz"
                  style={{ width: `${Math.max(2, (o.lift / maxLift) * 100)}%` }}
                />
              </span>
            </span>

            <span className="tnum text-right text-[12.5px] text-ink-2">
              {formatBudget(o.spent)}원
            </span>
            <span className="tnum text-right text-[15px] font-bold">
              +{o.lift.toFixed(1)}
              <span className="ml-0.5 text-[11px] font-semibold text-ink-3">%p</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-[11.5px] leading-[1.7] text-ink-3">
        상승폭 = 그 달 집행액 ÷ 그 지자체의 청년 세부사업 예산현액. 예산이 작을수록 한 건에
        크게 흔들려서 기본값으로 10억 미만을 가려 두었습니다. 월 표시의 <span aria-hidden>*</span>는
        자료가 중간에 끊긴 달입니다.
      </p>
    </section>
  );
}
