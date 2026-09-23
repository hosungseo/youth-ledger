"use client";

import { useMemo, useState } from "react";
import type { LinkUnit, MapShape } from "@/lib/types";

/** One blue ramp, light → dark: magnitude only, never identity. */
const RAMP = ["#dbe8fb", "#a9c8f5", "#6a9fe9", "#2f6fd1", "#173f8f"];
const NO_DATA = "var(--color-wash)";

type MetricKey = "perYouth" | "policies" | "absent" | "age";

interface Metric {
  key: MetricKey;
  label: string;
  question: string;
  value: (u: LinkUnit) => number | null;
  fmt: (v: number) => string;
  /** ordinal metrics keep fixed classes instead of quantiles */
  classes?: { label: string; test: (v: number) => boolean }[];
}

const won = (v: number) =>
  v >= 1e4 ? `${Math.round(v / 1e4).toLocaleString("ko-KR")}만 원` : `${Math.round(v).toLocaleString("ko-KR")}원`;

const METRICS: Metric[] = [
  {
    key: "perYouth",
    label: "청년 1인당 예산",
    question: "그 지자체가 청년 세부사업에 잡은 예산현액 ÷ 20~39세 주민등록인구",
    value: (u) => u.budgetPerYouth,
    fmt: won,
  },
  {
    key: "policies",
    label: "신청 가능한 지역 정책",
    question: "온통청년에서 대상 지역이 이 시·군·구를 포함하는 지자체 정책 수(광역 정책 포함, 중앙 제외)",
    value: (u) => u.policies,
    fmt: (v) => `${v.toLocaleString("ko-KR")}건`,
  },
  {
    key: "absent",
    label: "온통청년에 없는 비율",
    question: "그 지자체 청년 세부사업 가운데 온통청년에서 대응 정책을 찾지 못한 비율(자동 판정)",
    value: (u) => (u.programs ? u.absent / u.programs : null),
    fmt: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: "age",
    label: "청년 나이 상한",
    question: "그 시·군·구만 대상으로 하는 온통청년 정책에서 가장 흔한 연령 상한",
    value: (u) => u.ageCap,
    fmt: (v) => `${v}세`,
    classes: [
      { label: "34세 이하", test: (v) => v <= 34 },
      { label: "35~39세", test: (v) => v > 34 && v <= 39 },
      { label: "40~45세", test: (v) => v > 39 && v <= 45 },
      { label: "46~49세", test: (v) => v > 45 },
    ],
  },
];

function quantileBreaks(values: number[], k: number): number[] {
  const s = [...values].sort((a, b) => a - b);
  return Array.from({ length: k - 1 }, (_, i) => s[Math.floor(((i + 1) * s.length) / k)]);
}

export default function SigunguMap({
  shapes,
  units,
  width,
  height,
  outlines,
}: {
  shapes: MapShape[];
  units: LinkUnit[];
  width: number;
  height: number;
  /** 광역 outlines drawn on top, for orientation */
  outlines?: { sido: string; d: string }[];
}) {
  const [metricKey, setMetricKey] = useState<MetricKey>("perYouth");
  const [sido, setSido] = useState<string>("all");
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  const metric = METRICS.find((m) => m.key === metricKey)!;
  const byCode = useMemo(() => new Map(units.map((u) => [u.code, u])), [units]);
  const sidos = useMemo(() => [...new Set(shapes.map((s) => s.sido))].sort(), [shapes]);

  const { colorOf, legend } = useMemo(() => {
    const vals = shapes
      .map((s) => byCode.get(s.code))
      .filter((u): u is LinkUnit => !!u)
      .map((u) => metric.value(u))
      .filter((v): v is number => v != null);
    if (metric.classes) {
      const cls = metric.classes;
      const step = RAMP.length - cls.length;
      return {
        colorOf: (v: number | null) => {
          if (v == null) return NO_DATA;
          const i = cls.findIndex((c) => c.test(v));
          return RAMP[i + step];
        },
        legend: cls.map((c, i) => ({ color: RAMP[i + step], label: c.label })),
      };
    }
    const br = quantileBreaks(vals, RAMP.length);
    return {
      colorOf: (v: number | null) => {
        if (v == null) return NO_DATA;
        let i = 0;
        while (i < br.length && v >= br[i]) i++;
        return RAMP[i];
      },
      legend: RAMP.map((c, i) => ({
        color: c,
        label: i === 0 ? `~${metric.fmt(br[0])}` : i === RAMP.length - 1 ? `${metric.fmt(br[i - 1])}~` : `${metric.fmt(br[i - 1])}~`,
      })),
    };
  }, [shapes, byCode, metric]);

  const ranked = useMemo(() => {
    const rows = shapes
      .map((s) => byCode.get(s.code))
      .filter((u): u is LinkUnit => !!u && (sido === "all" || u.sido === sido))
      .map((u) => ({ u, v: metric.value(u) }))
      .filter((r): r is { u: LinkUnit; v: number } => r.v != null)
      .sort((a, b) => b.v - a.v);
    return rows;
  }, [shapes, byCode, metric, sido]);

  const focus = pinned ?? hover?.code ?? null;
  const fu = focus ? byCode.get(focus) : undefined;

  return (
    <div>
      {/* controls — one row above the chart */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="지표" className="flex flex-wrap gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={m.key === metricKey}
              onClick={() => setMetricKey(m.key)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                m.key === metricKey ? "border-ink bg-ink text-onink" : "border-hair bg-card text-ink-2 hover:bg-wash"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <select
          value={sido}
          onChange={(e) => setSido(e.target.value)}
          aria-label="광역 강조"
          className="ml-auto rounded-full border border-hair bg-card px-3.5 py-1.5 text-[13px]"
        >
          <option value="all">전국</option>
          {sidos.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.6] text-ink-3">{metric.question}</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="relative rounded-[20px] border border-hair bg-card p-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            role="img"
            aria-label={`시군구별 ${metric.label} 지도`}
            onMouseLeave={() => setHover(null)}
          >
            {shapes.map((s) => {
              const u = byCode.get(s.code);
              const v = u ? metric.value(u) : null;
              const dim = sido !== "all" && s.sido !== sido;
              const on = focus === s.code;
              return (
                <path
                  key={s.code}
                  d={s.d}
                  fill={colorOf(v)}
                  stroke={on ? "var(--color-ink)" : "var(--color-card)"}
                  strokeWidth={on ? 1.6 : 0.5}
                  opacity={dim ? 0.18 : 1}
                  className="cursor-pointer"
                  onMouseMove={(e) => {
                    const box = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    setHover({ code: s.code, x: e.clientX - box.left, y: e.clientY - box.top });
                  }}
                  onClick={() => setPinned(pinned === s.code ? null : s.code)}
                >
                  <title>{`${s.name} · ${v == null ? "자료 없음" : metric.fmt(v)}`}</title>
                </path>
              );
            })}
            {outlines?.map((o) => (
              <path key={o.sido} d={o.d} fill="none" stroke="var(--color-ink)" strokeOpacity={0.35} strokeWidth={0.9} pointerEvents="none" />
            ))}
          </svg>

          {hover && fu && !pinned && (
            <div
              className="pointer-events-none absolute z-10 w-[220px] rounded-[12px] border border-hair bg-card p-3 text-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
              style={{ left: Math.min(hover.x + 14, width - 230), top: hover.y + 14 }}
            >
              <UnitCard u={fu} />
            </div>
          )}

          {/* legend */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 pb-1 text-[11.5px] text-ink-2">
            {legend.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className="h-3 w-4 rounded-[2px]" style={{ background: l.color }} aria-hidden />
                {l.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-4 rounded-[2px]" style={{ background: NO_DATA }} aria-hidden />
              자료 없음
            </span>
          </div>
        </div>

        {/* side: pinned card + ranked table (the non-visual reading) */}
        <div>
          <div className="rounded-[16px] border border-hair bg-card p-4 text-[12.5px]">
            {fu ? (
              <>
                <UnitCard u={fu} />
                {pinned && (
                  <button onClick={() => setPinned(null)} className="mt-3 text-[12px] font-semibold text-ink-3 underline">
                    고정 해제
                  </button>
                )}
              </>
            ) : (
              <p className="text-[12.5px] leading-[1.6] text-ink-3">지도에서 시·군·구를 누르면 여기에 고정됩니다.</p>
            )}
          </div>
          <RankList title="높은 곳" rows={ranked.slice(0, 8)} fmt={metric.fmt} onPick={setPinned} />
          <RankList title="낮은 곳" rows={ranked.slice(-8).reverse()} fmt={metric.fmt} onPick={setPinned} />
        </div>
      </div>
    </div>
  );
}

function UnitCard({ u }: { u: LinkUnit }) {
  const rows: [string, string][] = [
    ["청년(20~39세)", `${u.youthPop.toLocaleString("ko-KR")}명`],
    ["청년 세부사업", `${u.programs}건 · ${u.budget.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억 원`],
    ["청년 1인당", u.budgetPerYouth != null ? won(u.budgetPerYouth) : "—"],
    ["집행률", u.budget ? `${Math.round((u.executed / u.budget) * 100)}%` : "—"],
    ["온통청년에 없음", `${u.absent}건 (${u.programs ? Math.round((u.absent / u.programs) * 100) : 0}%)`],
    ["신청 가능한 지역 정책", `${u.policies}건 · 지금 신청 ${u.policiesOpen}건`],
    ["청년 나이 상한", u.ageCap ? `${u.ageCap}세` : "—"],
  ];
  return (
    <div>
      <p className="text-[14px] font-bold">{u.name}</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-ink-3">{k}</dt>
            <dd className="tnum text-right font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function RankList({
  title,
  rows,
  fmt,
  onPick,
}: {
  title: string;
  rows: { u: LinkUnit; v: number }[];
  fmt: (v: number) => string;
  onPick: (code: string) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-[12px] font-semibold text-ink-3">{title}</p>
      <ol className="mt-1.5 border-t border-hair">
        {rows.map(({ u, v }) => (
          <li key={u.code}>
            <button
              onClick={() => onPick(u.code)}
              className="flex w-full items-baseline justify-between gap-3 border-b border-hair py-1.5 text-left text-[12.5px] hover:bg-wash"
            >
              <span className="truncate">{u.name}</span>
              <span className="tnum shrink-0 font-semibold">{fmt(v)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
