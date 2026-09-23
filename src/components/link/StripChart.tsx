"use client";

import { useState } from "react";

export interface StripRow {
  key: string;
  label: string;
  median: number;
  points: { id: string; name: string; value: number; note: string }[];
}

/** One row per group, one dot per member on a shared 0–100% axis, with the group median ticked. */
export default function StripChart({ rows, color }: { rows: StripRow[]; color: string }) {
  const [hover, setHover] = useState<{ id: string; name: string; value: number; note: string; x: number; y: number } | null>(null);
  const W = 640;
  const ROW = 30;
  const L = 78;
  const R = 58;
  const H = rows.length * ROW + 30;
  const x = (v: number) => L + v * (W - L - R);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="광역별 시·군·구 분포" onMouseLeave={() => setHover(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={6} y2={H - 22} stroke="var(--color-hair)" />
            <text x={x(t)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-ink-3)">
              {Math.round(t * 100)}%
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
                  r={4.5}
                  fill={color}
                  fillOpacity={0.55}
                  stroke="var(--color-card)"
                  strokeWidth={1}
                  onMouseEnter={(e) => {
                    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({ ...p, x: e.clientX - box.left, y: e.clientY - box.top });
                  }}
                >
                  <title>{`${p.name} · ${Math.round(p.value * 100)}%`}</title>
                </circle>
              ))}
              <line x1={x(r.median)} x2={x(r.median)} y1={cy - 10} y2={cy + 10} stroke="var(--color-ink)" strokeWidth={2.5} strokeLinecap="round" />
              <text x={W - R + 8} y={cy + 4} fontSize={11.5} fontWeight={600} fill="var(--color-ink-2)">
                {Math.round(r.median * 100)}%
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
            온통청년에 없음 {Math.round(hover.value * 100)}% · {hover.note}
          </p>
        </div>
      )}
      <p className="mt-1 text-[11.5px] text-ink-3">점 하나가 시·군·구, 검은 눈금이 광역 안의 중앙값입니다.</p>
    </div>
  );
}
