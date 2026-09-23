"use client";

import { useMemo, useState } from "react";
import { formatBudget } from "@/lib/design";

export interface ExecSeries {
  key: string;
  label: string;
  sub?: string;
  budget: number;
  executed: number;
  cumulative: number[];
  programs: number;
}

const W = 900;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 26, left: 46 };

const fmtDay = (ymd: string) => `${Number(ymd.slice(4, 6))}.${Number(ymd.slice(6))}`;

/** Cumulative execution against budget, as a share of each entity's own budget. */
export default function ExecChart({
  days,
  series,
  total,
}: {
  days: string[];
  series: ExecSeries[];
  total: ExecSeries;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [hover, setHover] = useState<number | null>(null);

  const shown = useMemo(
    () => (picked.length ? series.filter((s) => picked.includes(s.key)) : []),
    [series, picked],
  );

  const x = (i: number) =>
    PAD.left + (i / Math.max(1, days.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - v) * (H - PAD.top - PAD.bottom);

  const path = (s: ExecSeries) =>
    s.cumulative
      .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(s.budget > 0 ? v / s.budget : 0).toFixed(1)}`)
      .join("");

  // Month boundaries make the year legible without a dense axis.
  const monthTicks = days
    .map((d, i) => ({ d, i }))
    .filter(({ d }, k) => k === 0 || d.slice(4, 6) !== days[k - 1].slice(4, 6));

  const toggle = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const at = hover ?? days.length - 1;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="일별 누적 집행률">
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line
              x1={PAD.left} y1={y(g)} x2={W - PAD.right} y2={y(g)}
              stroke="var(--color-ink)" strokeOpacity={g === 0 ? 0.25 : 0.08}
            />
            <text
              x={PAD.left - 8} y={y(g) + 3.5} textAnchor="end"
              className="tnum" fontSize="10" fill="var(--color-ink-3)"
            >
              {g * 100}%
            </text>
          </g>
        ))}

        {monthTicks.map(({ d, i }) => (
          <g key={d}>
            <line
              x1={x(i)} y1={PAD.top} x2={x(i)} y2={H - PAD.bottom}
              stroke="var(--color-ink)" strokeOpacity={0.06}
            />
            <text
              x={x(i)} y={H - PAD.bottom + 14} textAnchor="middle"
              className="tnum" fontSize="10" fill="var(--color-ink-3)"
            >
              {Number(d.slice(4, 6))}월
            </text>
          </g>
        ))}

        {/* Everything, always, as the reference line. */}
        <path d={path(total)} fill="none" stroke="var(--color-ink)" strokeWidth={2.2} />

        {shown.map((s, i) => (
          <path
            key={s.key}
            d={path(s)}
            fill="none"
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={1.8}
          />
        ))}

        {hover != null && (
          <line
            x1={x(hover)} y1={PAD.top} x2={x(hover)} y2={H - PAD.bottom}
            stroke="var(--color-ink)" strokeOpacity={0.35}
          />
        )}

        <rect
          x={PAD.left} y={PAD.top}
          width={W - PAD.left - PAD.right} height={H - PAD.top - PAD.bottom}
          fill="transparent"
          onMouseMove={(e) => {
            const box = (e.target as SVGRectElement).getBoundingClientRect();
            const t = (e.clientX - box.left) / box.width;
            setHover(Math.max(0, Math.min(days.length - 1, Math.round(t * (days.length - 1)))));
          }}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 border-t border-hair pt-3">
        <span className="tnum text-[12.5px] font-semibold text-ink-2">
          {days[at].slice(0, 4)}.{fmtDay(days[at])} 기준
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px]">
          <span className="h-[3px] w-4 bg-ink" aria-hidden />
          전체{" "}
          <b className="tnum font-bold">
            {total.budget > 0 ? Math.round((total.cumulative[at] / total.budget) * 100) : 0}%
          </b>
          <span className="tnum text-ink-3">
            ({formatBudget(total.cumulative[at])}원)
          </span>
        </span>
        {shown.map((s, i) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[12.5px]">
            <span
              className="h-[3px] w-4"
              style={{ background: PALETTE[i % PALETTE.length] }}
              aria-hidden
            />
            {s.label}{" "}
            <b className="tnum font-bold">
              {s.budget > 0 ? Math.round((s.cumulative[at] / s.budget) * 100) : 0}%
            </b>
          </span>
        ))}
      </div>

      <div className="mt-5">
        <p className="text-[12px] font-semibold text-ink-3">
          겹쳐 볼 대상 {picked.length > 0 && `· ${picked.length}개 선택`}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {series.map((s) => {
            const on = picked.includes(s.key);
            const rate = s.budget > 0 ? s.executed / s.budget : 0;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => toggle(s.key)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                  on
                    ? "border-ink bg-ink font-semibold text-onink"
                    : "border-hair bg-card text-ink-2 hover:bg-wash"
                }`}
              >
                {s.label}
                <span className={`tnum ml-1.5 ${on ? "opacity-70" : "text-ink-3"}`}>
                  {Math.round(rate * 100)}%
                </span>
              </button>
            );
          })}
          {picked.length > 0 && (
            <button
              type="button"
              onClick={() => setPicked([])}
              className="rounded-full bg-wash-2 px-3 py-1.5 text-[12.5px] font-semibold text-ink-2 hover:bg-wash-2"
            >
              지우기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const PALETTE = [
  "#F87217", "#3B82F7", "#9233EB", "#EE4445",
  "#0D9488", "#D97706", "#7C3BEC", "#16A34A",
];
