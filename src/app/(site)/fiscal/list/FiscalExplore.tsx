"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FiscalMeta, FiscalProgram } from "@/lib/types";
import { TYPE_STYLES, formatBudget, typeStyle } from "@/lib/design";

type Sort = "budget" | "name" | "exec";
const PAGE = 30;

const REGION_ORDER = [
  "중앙", "서울", "부산", "대구", "인천", "광주", "전남", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "경북", "경남", "제주",
];

function matches(p: FiscalProgram, q: string) {
  if (!q) return true;
  return `${p.name} ${p.org} ${p.sector} ${p.region}`.toLowerCase().includes(q);
}

const rate = (p: FiscalProgram) =>
  p.executed != null && p.budget > 0 ? p.executed / p.budget : null;

export default function FiscalExplore({
  programs,
  meta,
  initialRegion = null,
  initialSector = null,
  initialType = null,
}: {
  programs: FiscalProgram[];
  meta: FiscalMeta;
  initialRegion?: string | null;
  initialSector?: string | null;
  initialType?: string | null;
}) {
  const params = useSearchParams();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<string | null>(initialRegion ?? params.get("region"));
  // 부문은 48종이라 칩으로 늘어놓을 수 없다. 부문 페이지에서 넘어올 때만
  // 걸리고, 지우기만 가능하게 둔다.
  const [sector, setSector] = useState<string | null>(initialSector ?? params.get("sector"));
  const [type, setType] = useState<string | null>(initialType ?? params.get("type"));
  const [level, setLevel] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("budget");
  // 온통청년에 대응 정책이 있는지(자동 판정)로 거른다. ?onthong=absent|present
  const initOnthong = params.get("onthong");
  const [onthong, setOnthong] = useState<"all" | "absent" | "present">(
    initOnthong === "absent" || initOnthong === "present" ? initOnthong : "all",
  );
  const onthongOk = (p: FiscalProgram) =>
    onthong === "all" || (onthong === "absent" ? !p.inOnthong : !!p.inOnthong);
  const [paging, setPaging] = useState({ sig: "", shown: PAGE });

  const dq = useDeferredValue(q.trim().toLowerCase());

  const facets = useMemo(() => {
    const pass = (p: FiscalProgram, skip: "region" | "type" | "level") =>
      matches(p, dq) &&
      (skip === "region" || !region || p.region === region) &&
      (skip === "type" || !type || p.type === type) &&
      (skip === "level" || !level || p.level === level) &&
      (!sector || p.sector === sector) &&
      onthongOk(p);
    const count = <T,>(skip: Parameters<typeof pass>[1], key: (p: FiscalProgram) => T) => {
      const m = new Map<T, number>();
      for (const p of programs) if (pass(p, skip)) m.set(key(p), (m.get(key(p)) ?? 0) + 1);
      return m;
    };
    return {
      region: count("region", (p) => p.region),
      type: count("type", (p) => p.type),
      level: count("level", (p) => p.level),
    };
  }, [programs, dq, region, type, level, sector, onthong]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const out = programs.filter(
      (p) =>
        matches(p, dq) &&
        (!region || p.region === region) &&
        (!type || p.type === type) &&
        (!level || p.level === level) &&
        (!sector || p.sector === sector) &&
        onthongOk(p),
    );
    out.sort((a, b) => {
      if (sort === "budget") return b.budget - a.budget;
      if (sort === "name") return a.name.localeCompare(b.name, "ko");
      return (rate(b) ?? -1) - (rate(a) ?? -1);
    });
    return out;
  }, [programs, dq, region, type, level, sector, onthong, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const sig = [dq, region, type, level, sector, onthong, sort].join("|");
  const shown = paging.sig === sig ? paging.shown : PAGE;

  const budgetSum = results.reduce((s, p) => s + p.budget, 0);
  const withExec = results.filter((p) => p.executed != null);
  const execBase = withExec.reduce((s, p) => s + p.budget, 0);
  const execSum = withExec.reduce((s, p) => s + (p.executed ?? 0), 0);
  const active = [region, type, level, sector, onthong === "all" ? null : onthong].filter(Boolean).length;

  const clearAll = () => {
    setRegion(null);
    setType(null);
    setLevel(null);
    setSector(null);
    setOnthong("all");
    setQ("");
  };

  const COLS: { key: Sort | null; label: string; cn: string }[] = [
    { key: "name", label: "세부사업명", cn: "text-left w-[40%]" },
    { key: null, label: "분야", cn: "text-left" },
    { key: null, label: "지역 · 기관", cn: "text-left" },
    { key: null, label: "부문", cn: "text-left" },
    { key: "budget", label: "예산현액", cn: "text-right" },
    { key: "exec", label: "집행률", cn: "text-right" },
  ];

  return (
    <>
      <div className="mt-7">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="월세, 면접수당, 청년센터, 괴산군…"
          aria-label="세부사업 검색"
          className="w-full rounded-full border border-hair bg-card px-6 py-4 text-[15px] outline-none transition-colors placeholder:text-ink-3 focus:border-ink/25"
        />
      </div>

      <div className="mt-5 space-y-3.5">
        <Row label="주체">
          <Pill active={level === null} onClick={() => setLevel(null)}>
            전체
          </Pill>
          <Pill
            active={level === "central"}
            onClick={() => setLevel(level === "central" ? null : "central")}
          >
            중앙부처 <Count n={facets.level.get("central") ?? 0} />
          </Pill>
          <Pill
            active={level === "local"}
            onClick={() => setLevel(level === "local" ? null : "local")}
          >
            지방자치단체 <Count n={facets.level.get("local") ?? 0} />
          </Pill>
        </Row>

        <Row label="분야">
          <Pill active={type === null} onClick={() => setType(null)}>
            전체
          </Pill>
          {TYPE_STYLES.map((t) => {
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
                    ? { backgroundColor: t.fg, borderColor: t.fg, color: "var(--color-onink)" }
                    : { backgroundColor: t.tile, borderColor: t.ring, color: t.fg }
                }
              >
                {t.short} <Count n={n} />
              </button>
            );
          })}
        </Row>

        <Row label="지역">
          <Pill active={region === null} onClick={() => setRegion(null)}>
            전체
          </Pill>
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
        </Row>
      </div>

      <div className="mt-3.5 flex items-start gap-3">
        <span className="mt-1.5 w-12 shrink-0 text-[12px] font-semibold text-ink-3">온통청년</span>
        <div className="flex flex-wrap items-center gap-2">
          <Pill active={onthong === "all"} onClick={() => setOnthong("all")}>
            전부
          </Pill>
          <Pill active={onthong === "absent"} onClick={() => setOnthong("absent")}>
            온통청년에 없는 것
          </Pill>
          <Pill active={onthong === "present"} onClick={() => setOnthong("present")}>
            온통청년에 있는 것
          </Pill>
          <span className="text-[11.5px] leading-[1.6] text-ink-3">
            자동 판정입니다(표본 검토 기준 ‘없음’ 판정의 약 {meta.accuracy?.absence}%가 맞음). 등록기관 확인 목록으로 쓰세요
          </span>
        </div>
      </div>

      {sector && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[12px] font-semibold text-ink-3">부문</span>
          <button
            type="button"
            onClick={() => setSector(null)}
            className="inline-flex items-center gap-2 rounded-full border border-ink bg-ink px-3.5 py-1.5 text-[13px] font-semibold text-onink"
          >
            {sector}
            <span aria-hidden>&times;</span>
          </button>
          <Link href="/fiscal/sectors" className="text-[12.5px] text-ink-2 hover:text-ink">
            부문 전체 보기
          </Link>
        </div>
      )}

      <div className="sticky top-[57px] z-20 -mx-5 mt-7 border-y border-hair bg-paper/90 px-5 py-3 backdrop-blur-md md:mx-0 md:rounded-full md:border md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-ink-2">
            <span className="tnum text-[16px] font-bold text-ink">
              {results.length.toLocaleString("ko-KR")}
            </span>
            <span className="font-semibold">개 세부사업</span>
            <span className="tnum ml-2 text-ink-3">· {formatBudget(budgetSum)}원</span>
            {execBase > 0 && (
              <span className="tnum ml-2 text-ink-3">
                · 집행 {Math.round((execSum / execBase) * 100)}%
              </span>
            )}
            {active > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-3 rounded-full bg-wash-2 px-2.5 py-1 text-[12px] font-semibold text-ink-2 hover:bg-wash-2"
              >
                조건 {active}개 지우기
              </button>
            )}
          </p>
          <p className="text-[12px] text-ink-3">열 이름을 눌러 정렬</p>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-16 rounded-[20px] border border-dashed border-hair bg-card py-20 text-center">
          <p className="text-[15px] font-semibold">조건에 맞는 사업이 없습니다.</p>
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
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[820px] border-separate border-spacing-0">
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th
                      key={c.label}
                      scope="col"
                      aria-sort={c.key && sort === c.key ? "descending" : undefined}
                      className={`border-b border-hair pb-2.5 text-[11.5px] font-semibold text-ink-3 ${c.cn}`}
                    >
                      {c.key ? (
                        <button
                          type="button"
                          onClick={() => setSort(c.key as Sort)}
                          className={`transition-colors hover:text-ink ${
                            sort === c.key ? "text-ink underline underline-offset-4" : ""
                          }`}
                        >
                          {c.label}
                          {sort === c.key && <span aria-hidden> ↓</span>}
                        </button>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, shown).map((p) => {
                  const s = typeStyle(p.type);
                  const r = rate(p);
                  return (
                    <tr key={p.id}>
                      <td className="border-b border-hair py-3 pr-4 align-top">
                        <span className="block text-[14.5px] leading-snug font-semibold tracking-[-0.01em]">
                          {p.name}
                        </span>
                        {p.inOnthong ? (
                          <span className="mt-1 block text-[11.5px] leading-snug text-ink-3">
                            온통청년 · {p.onthongName ?? "대응 정책 있음"}
                          </span>
                        ) : (
                          <span className="mt-1 inline-block border border-hair px-1.5 py-0.5 text-[10.5px] font-semibold text-t-biz">
                            온통청년에 없음{p.kind ? ` · ${p.kind}` : ""}
                          </span>
                        )}
                      </td>
                      <td className="border-b border-hair py-3 pr-4 align-top whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                          style={{ color: s.fg }}
                        >
                          <span className="h-2 w-2 shrink-0" style={{ background: s.fill }} aria-hidden />
                          {s.short}
                        </span>
                      </td>
                      <td className="border-b border-hair py-3 pr-4 align-top">
                        <span className="block text-[12.5px] font-medium">
                          {p.region === "중앙" ? "중앙부처" : p.region}
                        </span>
                        <span className="mt-0.5 block max-w-[20ch] truncate text-[12px] text-ink-3">
                          {p.org}
                        </span>

                      </td>
                      <td className="border-b border-hair py-3 pr-4 align-top text-[12px] text-ink-2">
                        {p.sector}
                      </td>
                      <td className="border-b border-hair py-3 align-top text-right">
                        <span className="tnum block text-[14px] font-bold whitespace-nowrap">
                          {formatBudget(p.budget)}
                          <span className="text-[11px] font-semibold text-ink-3">원</span>
                        </span>
                      </td>
                      <td className="border-b border-hair py-3 pl-4 align-top text-right">
                        {r == null ? (
                          <span className="text-[12px] text-ink-3">—</span>
                        ) : (
                          <>
                            <span className="tnum block text-[13px] font-semibold">
                              {Math.round(r * 100)}%
                            </span>
                            <span className="mt-1 ml-auto block h-1 w-[56px] bg-wash-2">
                              <span
                                className="block h-full"
                                style={{ width: `${Math.min(100, r * 100)}%`, background: s.fill }}
                              />
                            </span>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  ({shown}/{results.length.toLocaleString("ko-KR")})
                </span>
              </button>
            </div>
          )}
        </>
      )}

      <p className="mt-10 border-t border-hair pt-5 text-[12px] leading-[1.75] text-ink-3">
        출처 · {meta.source}. 분야는 원자료에 없어 사업명으로 추정했습니다. ‘온통청년에 없음’은 자동 판정입니다.
        예산현액은 세부사업 전체 금액이라 청년이 아닌 몫이 섞여 있을 수 있고,
        집행률은 8월 31일 기준이며 중앙(열린재정)은 집행액을 제공하지 않습니다.{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-ink">
          분류 규칙과 한계
        </Link>
      </p>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
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
