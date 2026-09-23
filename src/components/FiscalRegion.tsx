import Link from "next/link";
import type { FiscalMeta, FiscalProgram, Meta, SidoCollection } from "@/lib/types";
import { REGION_FULL, TYPE_STYLES, formatBudget, typeStyle } from "@/lib/design";
import RegionLocator from "@/components/RegionLocator";
import Crumbs from "@/components/Crumbs";

/** 광주·전남은 통합되어 한 행정구역이다. */
const PARTS: Record<string, string[]> = { 광주: ["광주", "전남"], 전남: ["광주", "전남"] };

export default function FiscalRegion({
  region,
  all,
  fiscalMeta,
  geo,
  meta,
}: {
  region: string;
  all: FiscalProgram[];
  fiscalMeta: FiscalMeta;
  geo: SidoCollection;
  meta: Meta;
}) {
  const parts = PARTS[region] ?? [region];
  const merged = parts.length > 1;
  const items = all.filter((p) => parts.includes(p.region));
  const full = merged ? "전남광주" : (REGION_FULL[region] ?? region);

  const budget = items.reduce((s, p) => s + p.budget, 0);
  const withExec = items.filter((p) => p.executed != null);
  const execBase = withExec.reduce((s, p) => s + p.budget, 0);
  const execSum = withExec.reduce((s, p) => s + (p.executed ?? 0), 0);

  // 전국 지방 평균과 견주어야 이 지역의 크기가 읽힌다.
  const local = all.filter((p) => p.level === "local");
  const nationalPer = local.length ? local.reduce((s, p) => s + p.budget, 0) / local.length : 0;
  const per = items.length ? budget / items.length : 0;
  const absent = items.filter((p) => !p.inOnthong).length;

  const byType = TYPE_STYLES.map((t) => {
    const mine = items.filter((p) => p.type === t.key);
    return { ...t, count: mine.length, budget: mine.reduce((s, p) => s + p.budget, 0) };
  }).filter((t) => t.count > 0);
  const maxType = Math.max(1, ...byType.map((t) => t.count));

  const bySector = new Map<string, { count: number; budget: number }>();
  for (const p of items) {
    const cur = bySector.get(p.sector) ?? { count: 0, budget: 0 };
    cur.count += 1;
    cur.budget += p.budget;
    bySector.set(p.sector, cur);
  }
  const sectors = [...bySector.entries()].sort((a, b) => b[1].count - a[1].count);

  const top = [...items].sort((a, b) => b.budget - a.budget).slice(0, 12);
  const lowExec = [...withExec]
    .filter((p) => p.budget >= 5)
    .sort((a, b) => (a.executed ?? 0) / a.budget - (b.executed ?? 0) / b.budget)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8">
      <Crumbs
        basis="fiscal"
        trail={[{ href: "/fiscal/plate", label: "판" }]}
        here={full}
      />

      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:gap-14">
        <div>
          <h1 className="text-[34px] leading-[1.15] font-bold tracking-[-0.035em] md:text-[44px]">
            {full}
          </h1>
          <p className="mt-4 max-w-[560px] text-[15px] leading-[1.85] text-ink-2">
            예산서에 청년 이름으로 잡힌 세부사업{" "}
            <b className="font-semibold text-ink">{items.length.toLocaleString("ko-KR")}건</b>,{" "}
            <b className="font-semibold text-ink">{formatBudget(budget)}원</b>입니다.
            한 사업에 실리는 돈은 평균 {formatBudget(per)}원으로, 전국 지방 평균{" "}
            {formatBudget(nationalPer)}원의{" "}
            {nationalPer > 0 ? `${Math.round((per / nationalPer) * 100)}%` : "—"} 수준입니다.
            {merged && " 광주와 전남은 통합되어 함께 셉니다."}{" "}
            이 가운데 <b className="font-semibold text-ink">{absent.toLocaleString("ko-KR")}건</b>은
            온통청년에서 대응 정책을 찾지 못했습니다(자동 판정).{" "}
            <Link
              href={`/fiscal/list?region=${encodeURIComponent(region)}&onthong=absent`}
              className="font-semibold underline underline-offset-2 hover:text-ink"
            >
              목록 보기
            </Link>
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-5">
            {[
              ["세부사업", items.length.toLocaleString("ko-KR"), "건"],
              ["예산현액", formatBudget(budget), "원"],
              ["집행률", execBase > 0 ? `${Math.round((execSum / execBase) * 100)}` : "—", "%"],
              ["온통청년에 없음", absent.toLocaleString("ko-KR"), "건"],
            ].map(([label, value, unit]) => (
              <div key={label}>
                <dt className="text-[12px] font-semibold text-ink-3">{label}</dt>
                <dd className="tnum mt-1 text-[30px] leading-none font-bold tracking-[-0.03em]">
                  {value}
                  <span className="ml-1 text-[14px] font-semibold text-ink-2">{unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="lg:pt-1">
          <RegionLocator geo={geo} meta={meta} region={region} />
          <figcaption className="mt-2 text-[12px] leading-[1.6] text-ink-3">
            굵은 테두리가 {full}입니다. 색은 온통청년 등록 정책 수라, 이 페이지의 숫자와는 다릅니다.
          </figcaption>
        </figure>
      </div>

      <section className="mt-14 grid gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">분야</h2>
          <p className="mt-2 text-[12.5px] text-ink-3">사업명으로 추정한 값입니다.</p>
          <ul className="mt-5 border-t border-hair">
            {byType.map((t) => (
              <li key={t.key}>
                <Link
                  href={`/fiscal/list?region=${encodeURIComponent(region)}`}
                  className="group grid grid-cols-[7rem_1fr_4rem] items-center gap-3 border-b border-hair py-3"
                >
                  <span className="truncate text-[13px] font-semibold group-hover:underline" style={{ color: t.fg }}>
                    {t.short}
                  </span>
                  <span className="relative h-4 bg-wash">
                    <span
                      className="absolute inset-y-0 left-0"
                      style={{ width: `${(t.count / maxType) * 100}%`, background: t.fill }}
                    />
                  </span>
                  <span className="tnum text-right text-[14px] font-bold">{t.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">부문</h2>
          <p className="mt-2 text-[12.5px] text-ink-3">
            예산서가 이 지역의 청년 사업을 어느 칸에 넣어 두었는지.
          </p>
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {sectors.map(([name, v]) => (
              <li key={name}>
                <Link
                  href={`/fiscal/list?region=${encodeURIComponent(region)}&sector=${encodeURIComponent(name)}`}
                  className="inline-flex items-baseline gap-1.5 border border-hair bg-card px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:bg-wash"
                >
                  {name}
                  <span className="tnum font-bold text-ink">{v.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {lowExec.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">집행이 더딘 사업</h2>
          <p className="mt-2 max-w-[620px] text-[13px] leading-[1.75] text-ink-2">
            8월 31일 기준입니다. 예산 5억 이상 가운데 집행률이 낮은 순서로,
            온통청년에서는 볼 수 없는 정보입니다. 연말에 몰아 쓰는 사업도 있으니
            낮다고 곧 문제라는 뜻은 아닙니다.
          </p>
          <ul className="mt-5 border-t border-hair">
            {lowExec.map((p) => {
              const r = (p.executed ?? 0) / p.budget;
              const s = typeStyle(p.type);
              return (
                <li
                  key={p.id}
                  className="grid grid-cols-[1fr_6rem_5rem] items-center gap-4 border-b border-hair py-3.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold">{p.name}</span>
                    <span className="mt-0.5 block text-[11.5px] text-ink-3">
                      {p.org} · {p.sector}
                    </span>
                  </span>
                  <span className="tnum text-right text-[13px] text-ink-2">
                    {formatBudget(p.budget)}원
                  </span>
                  <span className="text-right">
                    <span className="tnum block text-[14px] font-bold">{Math.round(r * 100)}%</span>
                    <span className="mt-1 ml-auto block h-1 w-[48px] bg-wash-2">
                      <span
                        className="block h-full"
                        style={{ width: `${Math.max(2, r * 100)}%`, background: s.fill }}
                      />
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">예산이 큰 사업</h2>
          <Link
            href={`/fiscal/list?region=${encodeURIComponent(region)}`}
            className="shrink-0 text-[13px] font-semibold text-ink-2 hover:text-ink"
          >
            {items.length.toLocaleString("ko-KR")}건 모두 보기 →
          </Link>
        </div>
        <ul className="mt-5 border-t border-hair">
          {top.map((p) => {
            const s = typeStyle(p.type);
            return (
              <li
                key={p.id}
                className="grid grid-cols-[1fr_7rem] items-center gap-4 border-b border-hair py-3.5"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold">{p.name}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-ink-3">
                    <span className="font-semibold" style={{ color: s.fg }}>{s.short}</span>
                    <span>{p.org}</span>
                    <span>{p.sector}</span>
                  </span>
                </span>
                <span className="tnum text-right text-[15px] font-bold">
                  {formatBudget(p.budget)}
                  <span className="text-[11px] font-semibold text-ink-3">원</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-14 border-t border-hair pt-6 text-[12px] leading-[1.8] text-ink-3">
        출처 · {fiscalMeta.source}. 예산현액은 세부사업 전체 금액이라 청년이 아닌 몫이
        섞여 있을 수 있습니다.{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-ink">
          분류 규칙과 한계
        </Link>
      </p>
    </div>
  );
}
