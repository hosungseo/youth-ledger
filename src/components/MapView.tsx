"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import KoreaMap, { type MapDatum } from "@/components/KoreaMap";
import { REGION_SLUG, TYPE_STYLES, formatBudget, typeStyle } from "@/lib/design";
import type { Meta, SidoCollection } from "@/lib/types";

/** 광주·전남은 통합되어 한 행정구역이므로 지도에서도 한 덩어리로 칠한다. */
const GROUP: Record<string, string> = { 광주: "전남광주", 전남: "전남광주" };
const groupOf = (region: string) => GROUP[region] ?? region;

const GROUP_LABEL: Record<string, string> = { 전남광주: "전남광주" };

export default function MapView({
  geo,
  meta,
}: {
  geo: SidoCollection;
  meta: Meta;
}) {
  const [type, setType] = useState<string | null>(null);
  const [mode, setMode] = useState<"count" | "budget">("count");
  const [hovered, setHovered] = useState<string | null>(null);

  const { data, groups } = useMemo(() => {
    // Roll the 시도 stats up to their administrative group first.
    const groups = new Map<string, { count: number; budget: number; parts: string[] }>();
    for (const [region, stat] of Object.entries(meta.byRegion)) {
      if (region === "중앙") continue;
      const g = groupOf(region);
      const cur = groups.get(g) ?? { count: 0, budget: 0, parts: [] };
      cur.count += type ? (stat.types[type] ?? 0) : stat.count;
      // Per-type budget is not in meta; fall back to the whole-region figure.
      cur.budget += type ? 0 : stat.budget;
      cur.parts.push(region);
      groups.set(g, cur);
    }

    const data: Record<string, MapDatum> = {};
    for (const f of geo.features) {
      const region = f.properties.name;
      const g = groupOf(region);
      const stat = groups.get(g);
      if (!stat) continue;
      data[region] = {
        group: g,
        value: mode === "count" ? stat.count : stat.budget,
        label: GROUP_LABEL[g] ?? g,
      };
    }
    return { data, groups };
  }, [geo, meta, type, mode]);

  const active = hovered ? groups.get(hovered) : null;
  const s = type ? typeStyle(type) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:gap-14">
      <div>
        <KoreaMap
          geo={geo}
          data={data}
          hovered={hovered}
          onHover={setHovered}
          format={(n) => (mode === "count" ? String(n) : formatBudget(n))}
          skin={
            s
              ? {
                  from: s.tile, to: s.fill, stroke: "var(--color-paper)",
                  label: "var(--color-ink)", labelHalo: "var(--color-paper)", count: s.fg, leader: "var(--color-ink)",
                }
              : undefined
          }
        />
      </div>

      <div className="lg:pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-ink-3">분야</span>
          <button
            type="button"
            onClick={() => { setType(null); setMode("count"); }}
            aria-pressed={type === null}
            className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
              type === null
                ? "border-ink bg-ink font-semibold text-onink"
                : "border-hair bg-card font-medium text-ink-2 hover:bg-wash"
            }`}
          >
            전체
          </button>
          {TYPE_STYLES.map((t) => {
            const on = type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => { setType(on ? null : t.key); setMode("count"); }}
                aria-pressed={on}
                className="rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                style={
                  on
                    ? { backgroundColor: t.fg, borderColor: t.fg, color: "var(--color-onink)" }
                    : { backgroundColor: t.tile, borderColor: t.ring, color: t.fg }
                }
              >
                {t.short}
              </button>
            );
          })}
        </div>

        {type === null && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-ink-3">표시</span>
            {(["count", "budget"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] transition-colors ${
                  mode === m
                    ? "border-ink bg-ink font-semibold text-onink"
                    : "border-hair bg-card font-medium text-ink-2 hover:bg-wash"
                }`}
              >
                {m === "count" ? "사업 수" : "예산"}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 min-h-[92px] border-t border-hair pt-5">
          {active && hovered ? (
            <>
              <p className="text-[17px] font-bold tracking-[-0.02em]">
                {GROUP_LABEL[hovered] ?? hovered}
              </p>
              <p className="mt-1 text-[13px] text-ink-2">
                <span className="tnum font-semibold text-ink">{active.count}</span>개 사업
                {type && <span className="text-ink-3"> · {type}</span>}
                {!type && (
                  <>
                    {" · "}
                    <span className="tnum font-semibold text-ink">{formatBudget(active.budget)}</span>원
                  </>
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {active.parts.map((r) => (
                  <Link
                    key={r}
                    href={`/notice/region/${REGION_SLUG[r]}`}
                    className="rounded-full border border-hair bg-card px-3 py-1.5 text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-wash"
                  >
                    {r} 자세히 →
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[15px] font-bold text-ink-2">지역을 짚어보세요</p>
              <p className="mt-1.5 max-w-[420px] text-[13px] leading-[1.7] text-ink-3">
                색이 진할수록 그 지역에 그만큼 몰려 있다는 뜻입니다.
                판이 답하지 못하는 것 — 어디와 어디가 붙어 있는지, 빈 곳이 어디로 이어지는지 —
                는 지도라야 보입니다.
                {" "}광주와 전남은 통합되어 한 덩어리로 칠했습니다.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
