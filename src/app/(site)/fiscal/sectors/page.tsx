import Link from "next/link";
import type { Metadata } from "next";
import { fiscal, fiscalPrograms } from "@/lib/data";
import { TYPE_STYLES, formatBudget, typeStyle } from "@/lib/design";

export const metadata: Metadata = {
  title: "부문",
  description:
    "청년 예산은 한 부문에 있지 않습니다. 노동·농업·사회복지·문화까지 — 예산서의 부문 분류로 본 청년 세부사업.",
};

export default function SectorsPage() {
  const bySector = new Map<string, typeof fiscalPrograms>();
  for (const p of fiscalPrograms) {
    bySector.set(p.sector, [...(bySector.get(p.sector) ?? []), p]);
  }

  const rows = [...bySector.entries()]
    .map(([sector, items]) => {
      const budget = items.reduce((s, p) => s + p.budget, 0);
      const withExec = items.filter((p) => p.executed != null);
      const execBase = withExec.reduce((s, p) => s + p.budget, 0);
      const types = new Map<string, number>();
      for (const p of items) types.set(p.type, (types.get(p.type) ?? 0) + 1);
      return {
        sector,
        count: items.length,
        budget,
        local: items.filter((p) => p.level === "local").length,
        execRate:
          execBase > 0
            ? withExec.reduce((s, p) => s + (p.executed ?? 0), 0) / execBase
            : null,
        types: [...types.entries()].sort((a, b) => b[1] - a[1]),
        biggest: [...items].sort((a, b) => b.budget - a.budget)[0],
      };
    })
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...rows.map((r) => r.count));
  const total = fiscalPrograms.length;
  const unknown = rows.find((r) => r.sector === "부문 미상");


  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[780px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] md:text-[44px]">
        청년 예산은 한 부문에 있지 않습니다.
      </h1>

      <p className="mt-5 max-w-[660px] text-[15px] leading-[1.85] text-ink-2">
        부문은 예산서가 돈을 갈라 놓는 칸입니다. 청년이라는 이름이 붙은 세부사업{" "}
        {total.toLocaleString("ko-KR")}건은 {rows.length}개 부문에 흩어져 있습니다. 가장 많은 곳은{" "}
        {rows.slice(0, 3).map((r, i) => (
          <span key={r.sector}>
            {i > 0 && (i === 2 ? ", 그리고 " : ", ")}
            <b className="font-semibold text-ink">{r.sector}</b> {r.count.toLocaleString("ko-KR")}건
          </span>
        ))}
        입니다. 청년정책을 한 부처·한 부문의 일로 보면 대부분을 놓칩니다. 온통청년이 범정부 목록이어야 하는 이유이기도 합니다.
      </p>

      <div className="mt-5 max-w-[720px] rounded-[16px] border border-dashed border-hair bg-paper p-5">
        <p className="text-[13px] leading-[1.8] text-ink-2">
          <b className="font-semibold text-ink">부문이 붙지 않은 사업</b>은{" "}
          {unknown ? `${unknown.count}건 ${formatBudget(unknown.budget)}원` : "없습니다"}입니다.
          지방은 지방재정365의 부문, 중앙은 열린재정의 부문을 그대로 옮겼습니다.
        </p>

      </div>

      <ol className="mt-12 border-t border-hair">
        {rows.map((r, i) => (
          <li key={r.sector} className="border-b border-hair py-5">
            <div className="grid items-center gap-x-5 gap-y-3 md:grid-cols-[2.5rem_13rem_minmax(0,1fr)_7rem_5rem]">
              <span className="tnum hidden text-[12px] text-ink-3 md:block">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div>
                <Link
                  href={`/fiscal/list?sector=${encodeURIComponent(r.sector)}`}
                  className="text-[14.5px] font-bold tracking-[-0.01em] hover:underline"
                >
                  {r.sector}
                </Link>
                <p className="mt-1 text-[11.5px] text-ink-3">
                  {r.local === r.count
                    ? "지방만"
                    : r.local === 0
                      ? "중앙만"
                      : `지방 ${r.local} · 중앙 ${r.count - r.local}`}
                  {r.execRate != null && ` · 집행 ${Math.round(r.execRate * 100)}%`}
                </p>
              </div>

              {/* Composition by 지원유형, so a sector's character is visible. */}
              <div>
                <span
                  className="flex h-5 w-full overflow-hidden bg-wash"
                  style={{ maxWidth: `${(r.count / maxCount) * 100}%` }}
                >
                  {r.types.map(([t, n]) => (
                    <span
                      key={t}
                      title={`${t} ${n}건`}
                      style={{ width: `${(n / r.count) * 100}%`, background: typeStyle(t).fill }}
                    />
                  ))}
                </span>
                {r.biggest && (
                  <p className="mt-1.5 truncate text-[11.5px] text-ink-3">
                    최대 · {r.biggest.name} {formatBudget(r.biggest.budget)}원
                  </p>
                )}
              </div>

              <span className="tnum text-right text-[13px] text-ink-2">
                {formatBudget(r.budget)}원
              </span>
              <span className="tnum text-right text-[17px] font-bold">
                {r.count}
                <span className="ml-0.5 text-[11px] font-semibold text-ink-3">건</span>
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[12px] font-semibold text-ink-3">막대 색 = 분야</span>
        {TYPE_STYLES.map((t) => (
          <span key={t.key} className="flex items-center gap-1.5 text-[12px] text-ink-2">
            <span className="h-2.5 w-2.5" style={{ background: t.fill }} aria-hidden />
            {t.short}
          </span>
        ))}
      </div>

      <p className="mt-12 border-t border-hair pt-6 text-[12px] leading-[1.8] text-ink-3">
        출처 · {fiscal.meta.source}. 부문은 예산서의 분류를 그대로 쓴 것이고,
        분야는 사업명으로 추정한 값입니다.{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-ink">
          분류 규칙과 한계
        </Link>
      </p>
    </div>
  );
}
