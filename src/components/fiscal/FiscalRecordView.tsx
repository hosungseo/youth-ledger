"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { REGION_FULL, formatBudget, typeStyle } from "@/lib/design";
import type { FiscalRecord, FiscalShard } from "@/lib/types";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/youth-ledger";
// reference categorical slots (validated adjacent pairs) for the 재원 split
const FUND_COLORS: Record<string, string> = { 국비: "#2a78d6", 시도비: "#eb6834", 시군구비: "#1baf7a", 기타: "#eda100" };
const cache = new Map<string, Promise<FiscalShard>>();

function loadShard(slug: string) {
  if (!cache.has(slug)) {
    cache.set(
      slug,
      fetch(`${BASE}/data/fp/${slug}.json`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<FiscalShard>;
      }),
    );
  }
  return cache.get(slug)!;
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const ymdDot = (d: string) => `${d.slice(0, 4)}. ${Number(d.slice(4, 6))}. ${Number(d.slice(6))}.`;

export default function FiscalRecordView() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const slug = params.get("r") ?? "";
  const [state, setState] = useState<{ shard?: FiscalShard; error?: string }>({});

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    loadShard(slug)
      .then((shard) => alive && setState({ shard }))
      .catch((e: unknown) => alive && setState({ error: e instanceof Error ? e.message : String(e) }));
    return () => {
      alive = false;
    };
  }, [slug]);

  if (!id || !slug) return <Missing why="주소에 세부사업 번호가 없습니다." />;
  if (state.error) return <Missing why={`자료를 불러오지 못했습니다 (${state.error}).`} />;
  if (!state.shard) return <p className="py-20 text-[14px] text-ink-3">세부사업을 불러오는 중…</p>;
  const f = state.shard.items[id];
  if (!f) return <Missing why="이 번호의 세부사업을 찾지 못했습니다. 목록에서 다시 골라 주세요." />;
  return <Record f={f} days={state.shard.days} />;
}

function Record({ f, days }: { f: FiscalRecord; days: string[] }) {
  const s = typeStyle(f.type);
  const o = f.onthong;
  const region = f.level === "central" ? "중앙부처" : REGION_FULL[f.region] ?? f.region;
  const fundTotal = Object.values(f.fund).reduce((a, b) => a + b, 0);
  const onthongState = o.present
    ? o.linkType === "partial"
      ? "일부만 등록"
      : "온통청년에 있음"
    : "온통청년에서 찾지 못함";

  return (
    <article>
      <nav className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-ink-3" aria-label="위치">
        <Link href="/fiscal/plate" className="hover:text-ink">재정 기준</Link>
        <span aria-hidden>›</span>
        <Link href="/fiscal/list" className="hover:text-ink">목록</Link>
        <span aria-hidden>›</span>
        <span className="text-ink-2">{f.name}</span>
      </nav>

      <div className="mt-4 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-14">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: s.fg }}>
              <span className="h-2 w-2" style={{ background: s.fill }} aria-hidden />
              {f.type}
            </span>
            <span className="text-ink-3">·</span>
            <span className="text-ink-2">{region} · {f.org}</span>
            {f.kind && <span className="ml-1 rounded-full bg-wash px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">{f.kind}</span>}
          </p>
          <h1 className="mt-3 text-[30px] leading-[1.22] font-bold tracking-[-0.03em] text-balance md:text-[40px]">{f.name}</h1>
          {(f.program || f.unit) && (
            <p className="mt-3 text-[13.5px] text-ink-2">
              {[f.program, f.unit].filter(Boolean).join(" › ")} › {f.name}
            </p>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-hair pt-6 md:grid-cols-4">
            <Fact k="예산현액" v={`${formatBudget(f.budget)}원`} />
            <Fact k="집행액" v={`${formatBudget(f.executed)}원`} sub={`집행률 ${pct(f.executed, f.budget)}%`} />
            <Fact k="온통청년" v={onthongState} />
            <Fact k="기준일" v={f.asof ? ymdDot(f.asof) : "—"} />
          </dl>

          <section className="mt-10">
            <h2 className="text-[15px] font-bold tracking-[-0.02em]">2026년 누적 집행</h2>
            <p className="mt-1.5 text-[12.5px] text-ink-3">
              {f.level === "central" ? "열린재정" : "지방재정365"} 스냅샷을 주마다 이어 붙였습니다. 점선은 지금의 예산현액입니다.
            </p>
            <ExecLine days={days} series={f.series} budget={f.budget} color={s.fill} />
          </section>

          {fundTotal > 0 && (
            <section className="mt-10">
              <h2 className="text-[15px] font-bold tracking-[-0.02em]">재원</h2>
              <div className="mt-3 flex h-4 w-full gap-[2px] overflow-hidden rounded-[4px]" role="img" aria-label="재원 구성">
                {Object.entries(f.fund).map(([k, v]) => (
                  <span key={k} title={`${k} ${formatBudget(v)}원`} style={{ width: `${(v / fundTotal) * 100}%`, background: FUND_COLORS[k] ?? "#8a8a92" }} />
                ))}
              </div>
              <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-ink-2">
                {Object.entries(f.fund).map(([k, v]) => (
                  <li key={k} className="inline-flex items-center gap-1.5">
                    <i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: FUND_COLORS[k] ?? "#8a8a92" }} />
                    {k} <b className="tnum font-semibold text-ink">{formatBudget(v)}원</b>
                    <span className="text-ink-3">{pct(v, fundTotal)}%</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-10">
            <h2 className="text-[15px] font-bold tracking-[-0.02em]">온통청년에서는</h2>
            {o.link ? (
              <Link href={`/notice/program/${o.link.id}`} className="group mt-3 block rounded-[16px] border border-hair bg-card p-4">
                <p className="text-[11.5px] font-semibold text-ink-3">{o.linkType === "partial" ? "일부만 등록된 정책" : "대응하는 온통청년 정책"}</p>
                <p className="mt-1 text-[15px] font-bold group-hover:underline">{o.link.name} →</p>
                {o.note && <p className="mt-1.5 text-[12.5px] text-ink-3">{o.note}</p>}
              </Link>
            ) : (
              <div className="mt-3 rounded-[16px] border border-dashed border-hair p-4">
                <p className="text-[14px] font-semibold">대응하는 온통청년 정책을 찾지 못했습니다.</p>
                <p className="mt-1 text-[12.5px] leading-[1.6] text-ink-3">
                  {o.note ?? "이름·기관·대상 지역으로 자동 대조한 결과입니다(표본 검토 기준 ‘없음’ 판정의 약 83%가 맞음). 등록기관이 확인할 목록으로 쓰세요."}
                </p>
              </div>
            )}
            {!o.link && o.cands.length > 0 && (
              <>
                <p className="mt-4 text-[12px] font-semibold text-ink-3">이름이 가장 가까웠던 온통청년 정책</p>
                <ol className="mt-1.5 border-t border-hair">
                  {o.cands.map((c) => (
                    <li key={c.id}>
                      <Link href={`/notice/program/${c.id}`} className="group flex items-baseline justify-between gap-3 border-b border-hair py-2.5 text-[13px]">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold group-hover:underline">{c.name}</span>
                          <span className="block truncate text-[11.5px] text-ink-3">{c.inst}</span>
                        </span>
                        <span className="tnum shrink-0 text-[11.5px] text-ink-3">유사도 {c.score.toFixed(2)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <dl className="space-y-3 text-[13px]">
            <Side k="자료" v={f.level === "central" ? "열린재정 세부사업" : "지방재정365 세부사업"} />
            <Side k="사업 코드" v={f.code} mono />
            <Side k="회계" v={f.account ?? "—"} />
            <Side k="분야·부문" v={[f.field, f.sector].filter(Boolean).join(" · ") || "—"} />
            <Side k="원인행위" v={`${formatBudget(f.committed)}원`} />
          </dl>
          <p className="mt-5 text-[11.5px] leading-[1.6] text-ink-3">
            ‘청년 세부사업’은 사업명에 ‘청년’ 등이 들어간 사업입니다. 분야는 이름으로 추정했고, 온통청년 대응 여부는 자동 판정입니다.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href={`/fiscal/list?q=${encodeURIComponent(f.name)}`} className="rounded-[12px] border border-hair bg-card px-4 py-2.5 text-[13.5px] font-semibold text-ink-2 hover:bg-wash">
              같은 이름의 세부사업 보기
            </Link>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${f.org.replace(/본청$/, "")} ${f.name}`)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-[12px] border border-hair bg-card px-4 py-2.5 text-[13.5px] font-semibold text-ink-2 hover:bg-wash"
            >
              사업 공고 검색 ↗
            </a>
          </div>
        </aside>
      </div>
    </article>
  );
}

/** Cumulative spending over the year with the current budget as a dashed reference; hover shows the week. */
function ExecLine({ days, series, budget, color }: { days: string[]; series: number[]; budget: number; color: string }) {
  const [hover, setHover] = useState<number | null>(null);
  // draw at the container's real width so axis text stays 11px on phones instead of shrinking with the viewBox
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(300, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(budget, ...series, 0.0001) * 1.08;
  // labels in 조 units ("5조 1,161억") need a wider left margin
  const H = W < 480 ? 200 : 220, P = { t: 14, r: 12, b: 26, l: max >= 1e4 ? 78 : 52 };
  const x = (i: number) => P.l + (i / Math.max(1, days.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const line = useMemo(() => series.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(""), [series, max, W]); // eslint-disable-line react-hooks/exhaustive-deps
  const area = `${line}L${x(series.length - 1).toFixed(1)},${y(0).toFixed(1)}L${x(0).toFixed(1)},${y(0).toFixed(1)}Z`;
  const months = days
    .map((d, i) => ({ d, i }))
    .filter(({ d }, k) => k === 0 || d.slice(4, 6) !== days[k - 1].slice(4, 6))
    // on narrow charts label every other month
    .filter((_, k) => W >= 480 || k % 2 === 0);
  const ticks = [0, 0.5, 1].map((t) => t * (max / 1.08));
  const at = hover ?? series.length - 1;
  if (!series.some((v) => v > 0)) {
    return <p className="mt-3 rounded-[14px] border border-dashed border-hair p-4 text-[13px] text-ink-3">아직 집행 기록이 없습니다.</p>;
  }
  return (
    <div className="mt-3" ref={box}>
      <p className="tnum text-[13px]">
        <b>{ymdDot(days[at])}</b> <span className="text-ink-2">누적 {formatBudget(series[at])}원 · 예산의 {pct(series[at], budget)}%</span>
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full touch-none"
        role="img"
        aria-label={`2026년 누적 집행 추이, 마지막 ${formatBudget(series[series.length - 1])}원`}
        onPointerMove={(e) => {
          const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - box.left) / box.width) * W;
          setHover(Math.max(0, Math.min(days.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (days.length - 1)))));
        }}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity={0.12} />
            <text x={P.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.55}>
              {formatBudget(t)}
            </text>
          </g>
        ))}
        {months.map(({ d, i }) => (
          <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.55}>
            {Number(d.slice(4, 6))}월
          </text>
        ))}
        <line x1={P.l} x2={W - P.r} y1={y(budget)} y2={y(budget)} stroke="currentColor" strokeOpacity={0.55} strokeDasharray="4 4" />
        <text x={W - P.r} y={y(budget) - 6} textAnchor="end" fontSize={11} fill="currentColor" opacity={0.7}>
          예산현액 {formatBudget(budget)}
        </text>
        <path d={area} fill={color} opacity={0.14} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <line x1={x(at)} x2={x(at)} y1={P.t} y2={H - P.b} stroke="currentColor" strokeOpacity={0.25} />
        <circle cx={x(at)} cy={y(series[at])} r={4.5} fill={color} stroke="var(--color-card)" strokeWidth={2} />
      </svg>
    </div>
  );
}

function Fact({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] font-semibold text-ink-3">{k}</dt>
      <dd className="tnum mt-1 text-[15px] leading-[1.4] font-bold">{v}</dd>
      {sub && <dd className="text-[11.5px] text-ink-3">{sub}</dd>}
    </div>
  );
}

function Side({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] gap-2">
      <dt className="text-[12px] text-ink-3">{k}</dt>
      <dd className={`min-w-0 break-all text-ink-2 ${mono ? "tnum" : ""}`}>{v}</dd>
    </div>
  );
}

function Missing({ why }: { why: string }) {
  return (
    <div className="py-20">
      <p className="text-[15px] font-semibold">{why}</p>
      <Link href="/fiscal/list" className="mt-3 inline-block text-[13.5px] font-semibold text-ink-2 underline underline-offset-2 hover:text-ink">
        세부사업 목록으로
      </Link>
    </div>
  );
}
