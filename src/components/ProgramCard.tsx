import Link from "next/link";
import type { Program } from "@/lib/types";
import { formatBudget, formatWhen, typeStyle } from "@/lib/design";
import TypeChip from "./TypeChip";

export default function ProgramCard({ program }: { program: Program }) {
  const s = typeStyle(program.type);
  return (
    <Link
      href={`/notice/program/${program.id}`}
      className="group relative flex flex-col overflow-hidden rounded-[18px] border border-hair bg-card p-5 transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)]"
    >
      <span
        className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: s.fill }}
        aria-hidden
      />

      <div className="flex items-center gap-2">
        <TypeChip type={program.type} />
        <span className="truncate text-[11.5px] font-medium text-ink-3">
          {program.region === "중앙" ? "중앙부처" : program.region}
        </span>
      </div>

      <h3 className="mt-3 text-[15.5px] leading-[1.4] font-bold tracking-[-0.02em] text-ink">
        {program.name}
      </h3>

      {program.summary && (
        <p className="mt-2 line-clamp-2 text-[13px] leading-[1.6] text-ink-2">
          {program.summary}
        </p>
      )}

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-hair pt-3.5">
        <div className="min-w-0">
          <p className="truncate text-[12px] font-medium text-ink-2">{program.agency}</p>
          <p className="mt-0.5 text-[11.5px] text-ink-3">{formatWhen(program.when)}</p>
        </div>
        <p className="tnum shrink-0 text-[15px] font-bold" style={{ color: s.fg }}>
          {formatBudget(program.budget)}
          {program.budget != null && (
            <span className="text-[11.5px] font-semibold text-ink-3">원</span>
          )}
        </p>
      </div>
    </Link>
  );
}
