import Link from "next/link";
import { TYPE_STYLES, typeStyle } from "@/lib/design";
import type { Meta } from "@/lib/types";
import TypeIcon from "./TypeIcon";

export default function TypeBento({ meta }: { meta: Meta }) {
  const counts = new Map(meta.types.map((t) => [t.value, t.count]));
  const ordered = [...TYPE_STYLES].sort(
    (a, b) => (counts.get(b.key) ?? 0) - (counts.get(a.key) ?? 0),
  );
  const max = Math.max(...ordered.map((t) => counts.get(t.key) ?? 0));

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {ordered.map((t, i) => {
        const n = counts.get(t.key) ?? 0;
        const s = typeStyle(t.key);
        // 2-2 / 1-1-1-1 / 2-2 over four columns: twelve cells, three full rows,
        // no ragged tail. The biggest and the smallest types get the wide tiles.
        const wide = i < 2 || i > 5;
        return (
          <Link
            key={t.key}
            href={`/notice/list?type=${encodeURIComponent(t.key)}`}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-[20px] border p-5 transition-transform duration-200 hover:-translate-y-0.5 ${
              wide ? "md:col-span-2 md:min-h-[168px]" : "md:min-h-[168px]"
            }`}
            style={{ backgroundColor: s.tile, borderColor: s.ring }}
          >
            <div className="flex items-start justify-between">
              <span
                className="grid h-9 w-9 place-items-center rounded-[11px] bg-paper/70"
                style={{ color: s.fg }}
              >
                <TypeIcon type={t.key} />
              </span>
              <span
                className="text-[11px] font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                style={{ color: s.fg }}
              >
                보기 →
              </span>
            </div>

            <div className="mt-6">
              <p className="text-[14px] font-bold tracking-[-0.02em]" style={{ color: s.fg }}>
                {t.label}
              </p>
              <p className="tnum mt-1 text-[26px] leading-none font-bold" style={{ color: s.fg }}>
                {n}
                <span className="ml-0.5 text-[13px] font-semibold opacity-70">개</span>
              </p>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-paper/60">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(n / max) * 100}%`, backgroundColor: s.fill }}
                />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
