"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TYPE_STYLES, formatBudget } from "@/lib/design";
import type { Basis } from "@/lib/basis";

export interface Cell {
  count: number;
  budget: number;
  /** Programs whose budget the source does not state (보증 한도 등). */
  unknown: number;
}

export interface Row {
  key: string;
  label: string;
  /** "region" rows link to a region page; "ministry" rows filter the 목록. */
  kind: "region" | "ministry";
  slug?: string;
  count: number;
  budget: number;
  cells: Cell[]; // aligned to TYPE_STYLES
  children?: Row[];
}

type Mode = "count" | "budget";

export interface Dataset {
  basis: Basis;
  rows: Row[];
  note: string;
}

const rowHref = (r: Row, basis: Basis) =>
  r.kind === "region"
    ? `/${basis}/region/${r.slug}`
    : `/${basis}/list?agency=${encodeURIComponent(r.label)}`;

/** 전남광주 같은 통합 줄은 뒤에 붙는 페이지가 없다. */
const rowLinkable = (r: Row) => (r.kind === "region" ? Boolean(r.slug) : true);

const cellHref = (r: Row, typeKey: string, basis: Basis) => {
  const q = new URLSearchParams();
  if (r.kind === "region") q.set("region", r.key);
  else q.set("agency", r.label);
  q.set("type", typeKey);
  return `/${basis}/list?${q}`;
};

export default function Plate({ data }: { data: Dataset }) {
  const basis = data.basis;
  const [mode, setMode] = useState<Mode>("count");
  const [hover, setHover] = useState<{ r: string; c: number } | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const rows = data.rows;

  const value = (c: Cell) => (mode === "count" ? c.count : c.budget);

  // Flattened for rendering: a parent is followed by its children when open.
  const flat = useMemo(() => {
    const out: { row: Row; depth: number }[] = [];
    for (const r of rows) {
      out.push({ row: r, depth: 0 });
      if (r.children && open.has(r.key)) {
        for (const c of r.children) out.push({ row: c, depth: 1 });
      }
    }
    return out;
  }, [rows, open]);

  const { max, colTotals, grandTotal } = useMemo(() => {
    let max = 0;
    const colTotals = TYPE_STYLES.map(() => 0);
    let grandTotal = 0;
    // Scale and totals come from the top-level rows only, so expanding a row
    // never rescales the plate under the reader.
    for (const row of rows) {
      row.cells.forEach((cell, i) => {
        const v = mode === "count" ? cell.count : cell.budget;
        if (v > max) max = v;
        colTotals[i] += v;
        grandTotal += v;
      });
    }
    return { max: max || 1, colTotals, grandTotal };
  }, [rows, mode]);

  // sqrt keeps the long tail of small cells from washing out to nothing.
  const weight = (v: number) => (v <= 0 ? 0 : 0.16 + 0.84 * Math.sqrt(v / max));

  const fmt = (v: number) =>
    mode === "count" ? String(v) : v >= 1 ? formatBudget(v) : "";

  const colMax = Math.max(...colTotals, 1);

  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-[600px] text-[13.5px] leading-[1.75] text-ink-2">{data.note}</p>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div
            className="flex overflow-hidden rounded-full border border-hair bg-card"
            role="group"
            aria-label="표시 항목"
          >
            {(["count", "budget"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`px-4 py-2 text-[13px] transition-colors ${
                  mode === m ? "bg-ink font-semibold text-onink" : "font-medium text-ink-2 hover:bg-wash"
                }`}
              >
                {m === "count" ? "사업 수" : "예산"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-0">
          <caption className="sr-only">
            줄별·분야별 청년정책 {mode === "count" ? "수" : "예산"}
          </caption>

          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 bg-paper pb-2 text-left align-bottom">
                <span className="text-[11px] font-semibold text-ink-3">주체 \ 유형</span>
              </th>
              {TYPE_STYLES.map((t, c) => (
                <th key={t.key} scope="col" className="px-1 pb-2 align-bottom">
                  <span
                    className={`block text-[11.5px] leading-tight font-semibold transition-opacity ${
                      hover && hover.c !== c ? "opacity-55" : "opacity-100"
                    }`}
                    style={{ color: t.fg }}
                  >
                    {t.short}
                  </span>
                  <span className="mt-1.5 block h-1 w-full overflow-hidden bg-wash-2">
                    <span
                      className="block h-full"
                      style={{ width: `${(colTotals[c] / colMax) * 100}%`, background: t.fill }}
                    />
                  </span>
                  <span className="tnum mt-1 block text-[10.5px] text-ink-3">{fmt(colTotals[c])}</span>
                </th>
              ))}
              <th scope="col" className="pb-2 pl-2 text-right align-bottom">
                <span className="text-[11px] font-semibold text-ink-3">합계</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {flat.map(({ row, depth }) => {
              const expandable = !!row.children?.length;
              const isOpen = open.has(row.key);
              return (
                <tr key={row.key}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 py-0.5 pr-3 text-left ${
                      depth ? "bg-wash-0" : "bg-paper"
                    }`}
                  >
                    <span
                      className={`flex items-baseline gap-2 transition-opacity ${
                        hover && hover.r !== row.key ? "opacity-55" : "opacity-100"
                      }`}
                      style={{ paddingLeft: depth ? 14 : 0 }}
                    >
                      {(row.kind === "region" ? rowLinkable(row) : true) ? (
                        <Link
                          href={rowHref(row, basis)}
                          className={`shrink-0 truncate hover:underline ${
                            depth
                              ? "w-[7.5rem] text-[12px] font-medium text-ink-2"
                              : "w-[5rem] text-[13px] font-semibold"
                          }`}
                        >
                          {row.label}
                        </Link>
                      ) : (
                        <span
                          className={`shrink-0 truncate ${
                            depth
                              ? "w-[7.5rem] text-[12px] font-medium text-ink-2"
                              : "w-[5rem] text-[13px] font-semibold"
                          }`}
                        >
                          {row.label}
                        </span>
                      )}
                      {expandable ? (
                        <button
                          type="button"
                          onClick={() => toggle(row.key)}
                          aria-expanded={isOpen}
                          className="tnum shrink-0 text-[11px] text-ink-3 hover:text-ink"
                        >
                          {row.key === "중앙"
                            ? `${row.children!.length}개 부처`
                            : "나눠 보기"}{" "}
                          {isOpen ? "▴" : "▾"}
                        </button>
                      ) : (
                        <span className="tnum hidden text-[11px] text-ink-3 sm:inline">
                          {mode === "count"
                            ? `${row.count}개`
                            : row.budget > 0
                              ? formatBudget(row.budget)
                              : "미상"}
                        </span>
                      )}
                    </span>
                  </th>

                  {row.cells.map((cell, c) => {
                    const t = TYPE_STYLES[c];
                    const v = value(cell);
                    const on = hover?.r === row.key || hover?.c === c;
                    const dim = hover && !on;
                    // Every program here withheld its figure: not zero money,
                    // just no published number.
                    const unpriced = mode === "budget" && cell.count > 0 && cell.budget <= 0;
                    return (
                      <td key={t.key} className="p-[2px]">
                        {unpriced ? (
                          <Link
                            href={cellHref(row, t.key, basis)}
                            onMouseEnter={() => setHover({ r: row.key, c })}
                            onMouseLeave={() => setHover(null)}
                            title={`${row.label} · ${t.label} — ${cell.count}개, 예산 미상`}
                            className={`grid place-items-center border border-dashed border-ink-3/35 text-ink-3 ${
                              depth ? "h-7 text-[10.5px]" : "h-9 text-[11px]"
                            }`}
                            style={{ opacity: dim ? 0.5 : 1 }}
                          >
                            미상
                          </Link>
                        ) : cell.count > 0 ? (
                          (() => {
                            const inner = {
                              onMouseEnter: () => setHover({ r: row.key, c }),
                              onMouseLeave: () => setHover(null),
                              title: `${row.label} · ${t.label} — ${cell.count}개, ${formatBudget(cell.budget)}원`,
                              className: `tnum grid place-items-center font-semibold transition-opacity ${
                                depth ? "h-7 text-[11px]" : "h-9 text-[12px]"
                              }`,
                              style: {
                                // tile → hot 사이 어디에 있든 글자는 한 색이다.
                                // 임계값을 두고 색을 갈아타면 그 언저리에서 반드시
                                // 읽히지 않는 구간이 생긴다. hot이 테마별로 다른
                                // 이유가 그것이다 — globals.css 주석 참고.
                                background: `color-mix(in oklab, ${t.hot} ${Math.round(weight(v) * 100)}%, ${t.tile})`,
                                color: "var(--color-ink)",
                                opacity: dim ? 0.5 : 1,
                              },
                            };
                            const cellLinkable =
                              row.kind !== "region" || Boolean(row.slug);
                            return cellLinkable ? (
                              <Link
                                href={cellHref(row, t.key, basis)}
                                onFocus={() => setHover({ r: row.key, c })}
                                onBlur={() => setHover(null)}
                                {...inner}
                              >
                                {fmt(v)}
                              </Link>
                            ) : (
                              <span {...inner}>{fmt(v)}</span>
                            );
                          })()
                        ) : (
                          <span
                            className={`grid place-items-center bg-wash-0 text-ink-3 ${
                              depth ? "h-7 text-[11px]" : "h-9 text-[12px]"
                            }`}
                            title={`${row.label} · ${t.label} — 없음`}
                          >
                            ·
                          </span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-0.5 pl-2 text-right">
                    <span
                      className={`tnum font-bold transition-opacity ${depth ? "text-[12px] text-ink-2" : "text-[13px]"} ${
                        hover && hover.r !== row.key ? "opacity-55" : "opacity-100"
                      }`}
                    >
                      {mode === "count"
                        ? row.count
                        : row.budget > 0
                          ? formatBudget(row.budget)
                          : "미상"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr>
              <th scope="row" className="sticky left-0 z-10 bg-paper pt-2 text-left">
                <span className="text-[11px] font-semibold text-ink-3">합계</span>
              </th>
              {TYPE_STYLES.map((t, c) => (
                <td key={t.key} className="px-1 pt-2 text-center">
                  <span className="tnum text-[11.5px] font-semibold" style={{ color: t.fg }}>
                    {fmt(colTotals[c])}
                  </span>
                </td>
              ))}
              <td className="pt-2 pr-0 pl-2 text-right">
                <span className="tnum text-[13px] font-bold">
                  {mode === "count" ? grandTotal : formatBudget(grandTotal)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
