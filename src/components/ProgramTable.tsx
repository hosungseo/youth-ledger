"use client";

import Link from "next/link";
import type { Program } from "@/lib/types";
import { formatBudget, formatWhen, typeStyle } from "@/lib/design";

export type Sort = "budget" | "name" | "region";

const COLS: { key: Sort | null; label: string; className: string }[] = [
  { key: "name", label: "사업명", className: "text-left w-[46%]" },
  { key: null, label: "분야", className: "text-left" },
  { key: "region", label: "지역 · 소관기관", className: "text-left" },
  { key: null, label: "시기", className: "text-left" },
  { key: "budget", label: "예산", className: "text-right" },
];

export default function ProgramTable({
  programs,
  sort,
  onSort,
}: {
  programs: Program[];
  sort: Sort;
  onSort: (s: Sort) => void;
}) {
  // One shared scale, so a row's bar is readable against every other row.
  const max = Math.max(...programs.map((p) => p.budget ?? 0), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0">
        <thead>
          <tr>
            {COLS.map((c) => (
              <th
                key={c.label}
                scope="col"
                aria-sort={c.key && sort === c.key ? "descending" : undefined}
                className={`border-b border-hair pb-2.5 text-[11.5px] font-semibold text-ink-3 ${c.className}`}
              >
                {c.key ? (
                  <button
                    type="button"
                    onClick={() => onSort(c.key as Sort)}
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
          {programs.map((p) => {
            const s = typeStyle(p.type);
            return (
              <tr key={p.id} className="group">
                <td className="border-b border-hair py-3 pr-4 align-top">
                  <Link href={`/notice/program/${p.id}`} className="block">
                    <span className="block text-[14.5px] leading-snug font-semibold tracking-[-0.01em] group-hover:underline">
                      {p.name}
                    </span>
                    {p.summary && (
                      <span className="mt-0.5 line-clamp-1 max-w-[52ch] text-[12.5px] text-ink-3">
                        {p.summary}
                      </span>
                    )}
                  </Link>
                </td>

                <td className="border-b border-hair py-3 pr-4 align-top whitespace-nowrap">
                  <Link
                    href={`/notice/list?type=${encodeURIComponent(p.type)}`}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                    style={{ color: s.fg }}
                  >
                    <span className="h-2 w-2 shrink-0" style={{ background: s.fill }} aria-hidden />
                    {s.short}
                  </Link>
                </td>

                <td className="border-b border-hair py-3 pr-4 align-top">
                  <span className="block text-[12.5px] font-medium">
                    {p.region === "중앙" ? "중앙부처" : p.region}
                  </span>
                  <span className="mt-0.5 block max-w-[24ch] truncate text-[12px] text-ink-3">
                    {p.agency}
                  </span>
                </td>

                <td className="border-b border-hair py-3 pr-4 align-top text-[12.5px] whitespace-nowrap text-ink-2">
                  {formatWhen(p.when)}
                </td>

                <td className="border-b border-hair py-3 align-top text-right">
                  <span className="tnum block text-[14px] font-bold whitespace-nowrap">
                    {formatBudget(p.budget)}
                    {p.budget != null && <span className="text-[11px] font-semibold text-ink-3">원</span>}
                  </span>
                  {p.budget != null && (
                    <span className="mt-1 ml-auto block h-1 w-[72px] bg-wash-2">
                      <span
                        className="block h-full"
                        style={{
                          // sqrt: without it every row but the largest few is a sliver.
                          width: `${Math.max(2, Math.sqrt((p.budget ?? 0) / max) * 100)}%`,
                          background: s.fill,
                        }}
                      />
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
