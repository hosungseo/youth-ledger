"use client";

import { useState } from "react";

export interface StripRow {
  key: string;
  label: string;
  median: number;
  points: { id: string; name: string; value: number; note: string }[];
}

/** One row per group, one dot per member on a shared 0–100% axis, with the group median ticked. */
export default function StripChart({
  rows,
  color,
  max = 1,
  format = "pct",
  tipLabel = "온통청년에 없음",
  highlight,
  caption = "점 하나가 시·군·구, 검은 눈금이 광역 안의 중앙값입니다.",
}: {
  rows: StripRow[];
  color: string;
  /** axis upper bound in value units (1 for shares) */
  max?: number;
  format?: "pct" | "count";
  tipLabel?: string;
  /** point id drawn solid and ringed — e.g. the reader's own 시·군·구 */
  highlight?: string;
  caption?: string;
}) {
  const f = (v: number) => (format === "pct" ? `${Math.round(v * 100)}%` : `${Math.round(v).toLocaleString("ko-KR")}건`);
  const [hover, setHover] = useState<{ id: string; name: string; value: number; note: string; x: number; y: number } | null>(null);
  const W = 640;
  const ROW = 30;
  const L = 78;
  const R = 58;
  const H = rows.length * ROW + 30;
  const x = (v: number) => L + (Math.min(v, max) / max) * (W - L - R);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="광역별 시·군·구 분포" onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={x(t * max)} x2={x(t * max)} y1={6} y2={H - 22} stroke="var(--color-hair)" />
            <text x={x(t * max)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-ink-3)">
              {f(t * max)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const cy = 18 + i * ROW;
          return (
            <g key={r.key}>
              <text x={L - 10} y={cy + 4} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--color-ink)">
                {r.label}
              </text>
              {r.points.map((p, j) => (
                <circle
                  key={p.id}
                  cx={x(p.value)}
                  // deterministic jitter so dense rows stay readable
                  cy={cy + ((j * 37) % 11) - 5}
                  r={p.id === highlight ? 7 : 4.5}
                  fill={p.id === highlight ? "var(--color-ink)" : color}
                  fillOpacity={p.id === highlight ? 1 : 0.55}
                  stroke={p.id === highlight ? "var(--color-card)" : "var(--color-card)"}
                  strokeWidth={p.id === highlight ? 2.5 : 1}
                  onMouseEnter={(e) => {
                    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({ ...p, x: e.clientX - box.left, y: e.clientY - box.top });
                  }}
                >
                  <title>{`${p.name} · ${f(p.value)}`}</title>
                </circle>
              ))}
              <line x1={x(r.median)} x2={x(r.median)} y1={cy - 10} y2={cy + 10} stroke="var(--color-ink)" strokeWidth={2.5} strokeLinecap="round" />
              <text x={W - R + 8} y={cy + 4} fontSize={11.5} fontWeight={600} fill="var(--color-ink-2)">
                {f(r.median)}
              </text>
            </g>
          );
        })}
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-[10px] border border-hair bg-card px-3 py-2 text-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
          style={{ left: Math.min(hover.x + 12, 460), top: hover.y + 12 }}
        >
          <p className="font-bold">{hover.name}</p>
          <p className="tnum mt-0.5 text-ink-2">
            {tipLabel} {f(hover.value)}
            {hover.note ? ` · ${hover.note}` : ""}
          </p>
        </div>
      )}
      <p className="mt-1 text-[11.5px] text-ink-3">{caption}</p>
    </div>
  );
}
