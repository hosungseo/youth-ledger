"use client";

import { useState } from "react";

export interface Series {
  key: string;
  label: string;
  color: string;
  /** ink used for a direct label sitting on this color */
  onColor?: string;
}

const FORMATS = {
  count: (v: number) => `${Math.round(v).toLocaleString("ko-KR")}건`,
  eok: (v: number) => (v >= 1e4 ? `${(v / 1e4).toFixed(1)}조` : `${Math.round(v).toLocaleString("ko-KR")}억`),
};

export interface BarRow {
  key: string;
  label: string;
  sub?: string;
  values: Record<string, number>;
}

/**
 * Horizontal stacked bars. `share` normalizes each row to 100% (part-to-whole);
 * `absolute` keeps a common scale across rows. 2px surface gap between segments,
 * direct labels only where a segment is wide enough to hold one.
 */
export default function StackedBars({
  series,
  rows,
  mode = "share",
  format,
  labelWidth = "7.5rem",
  minLabelShare = 0.09,
}: {
  series: Series[];
  rows: BarRow[];
  mode?: "share" | "absolute";
  /** named, not a function: rows are rendered on the server and handed to this client component */
  format: keyof typeof FORMATS;
  labelWidth?: string;
  minLabelShare?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const fmt = FORMATS[format];
  const max = Math.max(...rows.map((r) => series.reduce((s, x) => s + (r.values[x.key] ?? 0), 0)), 1);

  return (
    <div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>

      <div className="mt-3 space-y-2.5">
        {rows.map((r) => {
          const total = series.reduce((s, x) => s + (r.values[x.key] ?? 0), 0);
          const scale = mode === "share" ? (total || 1) : max;
          const on = hover === r.key;
          return (
            <div
              key={r.key}
              className="relative flex items-center gap-3"
              onMouseEnter={() => setHover(r.key)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="shrink-0 text-[12.5px] leading-tight" style={{ width: labelWidth }}>
                <span className="block font-semibold">{r.label}</span>
                {r.sub && <span className="block text-[11px] text-ink-3">{r.sub}</span>}
              </span>
              <span className="flex h-7 flex-1">
              <span className="flex h-7 gap-[2px]" style={{ width: mode === "absolute" ? `${(total / max) * 100}%` : "100%" }}>
                {series.map((s, i) => {
                  const v = r.values[s.key] ?? 0;
                  if (v <= 0) return null;
                  const w = v / (mode === "share" ? scale : total || 1);
                  const first = series.slice(0, i).every((x) => !(r.values[x.key] > 0));
                  const last = series.slice(i + 1).every((x) => !(r.values[x.key] > 0));
                  return (
                    <span
                      key={s.key}
                      className="flex items-center justify-center overflow-hidden text-[11px] font-semibold"
                      style={{
                        flexGrow: w,
                        flexBasis: 0,
                        background: s.color,
                        color: s.onColor ?? "#fff",
                        borderRadius: `${first ? 4 : 0}px ${last ? 4 : 0}px ${last ? 4 : 0}px ${first ? 4 : 0}px`,
                        opacity: hover && !on ? 0.55 : 1,
                      }}
                    >
                      {v / (total || 1) >= minLabelShare ? `${Math.round((v / (total || 1)) * 100)}%` : ""}
                    </span>
                  );
                })}
              </span>
              </span>
              <span className="tnum w-[5.5rem] shrink-0 text-right text-[12px] font-semibold">{fmt(total)}</span>

              {on && (
                <div className="pointer-events-none absolute top-full left-[8rem] z-10 mt-1 min-w-[220px] rounded-[12px] border border-hair bg-card p-3 text-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.12)]">
                  <p className="font-bold">{r.label}</p>
                  <ul className="mt-1.5 space-y-0.5">
                    {series.map((s) => (
                      <li key={s.key} className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center gap-1.5 text-ink-2">
                          <span className="h-2 w-2 rounded-[2px]" style={{ background: s.color }} aria-hidden />
                          {s.label}
                        </span>
                        <span className="tnum font-semibold">
                          {fmt(r.values[s.key] ?? 0)} · {Math.round(((r.values[s.key] ?? 0) / (total || 1)) * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
