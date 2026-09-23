"use client";

import { useMemo, useState, useDeferredValue, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Meta, Program } from "@/lib/types";
import { TYPE_STYLES, typeStyle, formatBudget } from "@/lib/design";
import ProgramTable, { type Sort } from "@/components/ProgramTable";

const PAGE = 24;

const REGION_ORDER = [
  "중앙", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

/** Cheap Korean-friendly match: name, summary, agency, target. */
function matches(p: Program, q: string) {
  if (!q) return true;
  const hay = `${p.name} ${p.summary} ${p.agency} ${p.operator} ${p.target} ${p.region}`;
  return hay.toLowerCase().includes(q);
}

export default function ExploreClient({
  programs,
  meta,
}: {
  programs: Program[];
  meta: Meta;
}) {
  const params = useSearchParams();

  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string | null>(params.get("region"));
  const [type, setType] = useState<string | null>(params.get("type"));
  const [section, setSection] = useState<string | null>(params.get("section"));
  const [month, setMonth] = useState<number | null>(
    params.get("month") ? Number(params.get("month")) : null,
  );
  const [alwaysOnly, setAlwaysOnly] = useState(params.get("when") === "always");
  // Set from the plate's ministry rows. Not a pill row of its own — 119 offices
  // would swamp the filter block — but it is visible and clearable below.
  const [agency, setAgency] = useState<string | null>(params.get("agency"));
  const [sort, setSort] = useState<Sort>("budget");
  // Paging is scoped to the current filter set: when the filters change the
  // list restarts at one page. Derived during render rather than reset from an
  // effect, which would render the long list once before trimming it.
  const [paging, setPaging] = useState({ sig: "", shown: PAGE });

  const dq = useDeferredValue(q.trim().toLowerCase());

  // Keep the URL shareable. history.replaceState rather than window.history.replaceState:
  // the router re-renders this component, which re-runs the effect, which
  // navigates again — an endless request loop. The filters live in React state,
  // so the URL only needs to mirror them.
  useEffect(() => {
    const sp = new URLSearchParams();
    if (region) sp.set("region", region);
    if (type) sp.set("type", type);
    if (section) sp.set("section", section);
    if (month) sp.set("month", String(month));
    if (alwaysOnly) sp.set("when", "always");
    if (agency) sp.set("agency", agency);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `/notice/list?${qs}` : "/notice/list");
  }, [region, type, section, month, alwaysOnly, agency]);

  const facets = useMemo(() => {
    const pass = (p: Program, skip: "region" | "type" | "section" | "when") =>
      matches(p, dq) &&
      (!agency || p.agency === agency) &&
      (skip === "region" || !region || p.region === region) &&
      (skip === "type" || !type || p.type === type) &&
      (skip === "section" || !section || p.section === section) &&
      (skip === "when" ||
        ((!month || p.when.months.includes(month)) && (!alwaysOnly || p.when.always)));

    const count = <T,>(skip: Parameters<typeof pass>[1], key: (p: Program) => T) => {
      const m = new Map<T, number>();
      for (const p of programs) if (pass(p, skip)) m.set(key(p), (m.get(key(p)) ?? 0) + 1);
      return m;
    };

    const whenPool = programs.filter((p) => pass(p, "when"));
    return {
      region: count("region", (p) => p.region),
      type: count("type", (p) => p.type),
      section: count("section", (p) => p.section),
      month: new Map(
        Array.from({ length: 12 }, (_, i) => [
          i + 1,
          whenPool.filter((p) => p.when.months.includes(i + 1)).length,
        ]),
      ),
      always: whenPool.filter((p) => p.when.always).length,
    };
  }, [programs, dq, region, type, section, month, alwaysOnly, agency]);

  const results = useMemo(() => {
    const out = programs.filter(
      (p) =>
        matches(p, dq) &&
        (!agency || p.agency === agency) &&
        (!region || p.region === region) &&
        (!type || p.type === type) &&
        (!section || p.section === section) &&
        (!month || p.when.months.includes(month)) &&
        (!alwaysOnly || p.when.always),
    );
    out.sort((a, b) => {
      if (sort === "budget") return (b.budget ?? -1) - (a.budget ?? -1);
      if (sort === "name") return a.name.localeCompare(b.name, "ko");
      return (
        REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region) ||
        (b.budget ?? 0) - (a.budget ?? 0)
      );
    });
    return out;
  }, [programs, dq, region, type, section, month, alwaysOnly, agency, sort]);

  const sig = [dq, region, type, section, month, alwaysOnly, agency, sort].join("\u0000");
  const shown = paging.sig === sig ? paging.shown : PAGE;

  const budgetSum = results.reduce((s, p) => s + (p.budget ?? 0), 0);
  const active = [region, type, section, month, agency, alwaysOnly || null].filter(Boolean).length;

  const clearAll = () => {
    setRegion(null); setType(null); setSection(null);
    setMonth(null); setAlwaysOnly(false); setAgency(null); setQ("");
  };

  return (
    <>
      {/* Search */}
      <div className="relative mt-7">
        <svg
          className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-ink-3"
          width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden
        >
          <circle cx="7.4" cy="7.4" r="5.2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M11.3 11.3 15 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="월세, 면접수당, 자격증, 강원, 고용노동부…"
          aria-label="사업 검색"
          className="w-full rounded-full border border-hair bg-card py-4 pr-5 pl-13 text-[15px] outline-none transition-colors placeholder:text-ink-3 focus:border-ink/25"
        />
      </div>

      {/* Filters */}
      <div className="mt-5 space-y-3.5">
        <FilterRow label="주체">
          <Pill active={section === null} onClick={() => setSection(null)}>전체</Pill>
          <Pill active={section === "central"} onClick={() => setSection(section === "central" ? null : "central")}>
            중앙부처 <Count n={facets.section.get("central") ?? 0} />
          </Pill>
          <Pill active={section === "local"} onClick={() => setSection(section === "local" ? null : "local")}>
            지방자치단체 <Count n={facets.section.get("local") ?? 0} />
          </Pill>
        </FilterRow>

        <FilterRow label="분야">
          <Pill active={type === null} onClick={() => setType(null)}>전체</Pill>
          {TYPE_STYLES.map((t) => {
            const s = typeStyle(t.key);
            const on = type === t.key;
            const n = facets.type.get(t.key) ?? 0;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(on ? null : t.key)}
                aria-pressed={on}
                disabled={n === 0 && !on}
                className="shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:opacity-35"
                style={
                  on
                    ? { backgroundColor: s.fg, borderColor: s.fg, color: "var(--color-onink)" }
                    : { backgroundColor: s.tile, borderColor: s.ring, color: s.fg }
                }
              >
                {t.short} <Count n={n} />
              </button>
            );
          })}
        </FilterRow>

        <FilterRow label="지역">
          <Pill active={region === null} onClick={() => setRegion(null)}>전체</Pill>
          {REGION_ORDER.map((r) => {
            const n = facets.region.get(r) ?? 0;
            return (
              <Pill
                key={r}
                active={region === r}
                disabled={n === 0 && region !== r}
                onClick={() => setRegion(region === r ? null : r)}
              >
                {r === "중앙" ? "중앙부처" : r} <Count n={n} />
              </Pill>
            );
          })}
        </FilterRow>

        <FilterRow label="시기">
          <Pill active={month === null && !alwaysOnly} onClick={() => { setMonth(null); setAlwaysOnly(false); }}>
            전체
          </Pill>
          <Pill
            active={alwaysOnly}
            disabled={facets.always === 0 && !alwaysOnly}
            onClick={() => { setAlwaysOnly(!alwaysOnly); setMonth(null); }}
          >
            연중 상시 <Count n={facets.always} />
          </Pill>
          {meta.monthHistogram.map((m) => {
            const n = facets.month.get(m.month) ?? 0;
            return (
              <Pill
                key={m.month}
                active={month === m.month}
                disabled={n === 0 && month !== m.month}
                onClick={() => { setMonth(month === m.month ? null : m.month); setAlwaysOnly(false); }}
              >
                {m.month}월 <Count n={n} />
              </Pill>
            );
          })}
        </FilterRow>
      </div>

      {agency && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[12px] font-semibold text-ink-3">기관</span>
          <button
            type="button"
            onClick={() => setAgency(null)}
            className="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-onink"
          >
            {agency}
            <span aria-hidden>✕</span>
          </button>
        </div>
      )}

      {/* Result bar */}
      <div className="sticky top-[57px] z-20 -mx-5 mt-7 border-y border-hair bg-paper/90 px-5 py-3 backdrop-blur-md md:mx-0 md:rounded-full md:border md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-ink-2">
            <span className="tnum text-[16px] font-bold text-ink">{results.length}</span>
            <span className="font-semibold">개 사업</span>
            {budgetSum > 0 && (
              <span className="tnum ml-2 text-ink-3">· {formatBudget(budgetSum)}원</span>
            )}
            {active > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-3 rounded-full bg-wash-2 px-2.5 py-1 text-[12px] font-semibold text-ink-2 hover:bg-wash-2"
              >
                조건 {active}개 지우기 ✕
              </button>
            )}
          </p>
          <p className="text-[12px] text-ink-3">열 이름을 눌러 정렬</p>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="mt-16 rounded-[20px] border border-dashed border-hair bg-card py-20 text-center">
          <p className="text-[15px] font-semibold">조건에 맞는 사업이 없습니다.</p>
          <p className="mt-1.5 text-[13px] text-ink-3">검색어를 줄이거나 조건을 지워보세요.</p>
          <button
            type="button"
            onClick={clearAll}
            className="mt-5 rounded-full bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-onink"
          >
            조건 모두 지우기
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6">
            <ProgramTable programs={results.slice(0, shown)} sort={sort} onSort={setSort} />
          </div>
          {shown < results.length && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setPaging({ sig, shown: shown + PAGE })}
                className="rounded-full border border-hair bg-card px-6 py-3 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-wash"
              >
                {Math.min(PAGE, results.length - shown)}개 더 보기
                <span className="tnum ml-1.5 text-ink-3">
                  ({shown}/{results.length})
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 w-9 shrink-0 text-[12px] font-semibold text-ink-3">{label}</span>
      <div className="-mx-1 flex flex-wrap gap-1.5 px-1">{children}</div>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="tnum opacity-55">{n}</span>;
}

function Pill({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors disabled:opacity-35 ${
        active
          ? "border-ink bg-ink font-semibold text-onink"
          : "border-hair bg-card font-medium text-ink-2 hover:bg-wash disabled:hover:bg-card"
      }`}
    >
      {children}
    </button>
  );
}
