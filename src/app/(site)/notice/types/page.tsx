import Link from "next/link";
import type { Metadata } from "next";
import { meta, programs } from "@/lib/data";
import { REGION_SLUG, TYPE_STYLES, formatBudget, josa } from "@/lib/design";

export const metadata: Metadata = {
  title: "분야",
  description:
    "취업·창업·주거·교육·금융·문화·참여·기반. 청년정책 여덟 갈래를 건수로 견줍니다.",
};

/** What each 유형 actually does. Figures are rendered from data, never written in. */
const BLURB: Record<string, string> = {
  "취업·일경험": "구직활동 지원, 인턴·일경험, 면접수당, 재직자 지원까지. 온통청년에서 가장 많이 등록된 갈래입니다.",
  "창업·농어업": "청년 창업 공간·자금과 함께 청년농업인 영농정착처럼 농어업 창업이 이 갈래로 들어옵니다. 예산서에서는 가장 큰 갈래입니다.",
  "주거": "월세·전세 이자·보증금 지원과 청년주택. 광역과 시군이 같은 이름으로 따로 운영하는 경우가 많습니다.",
  "교육·역량": "자격증 응시료, 교육비, 장학금, 역량 강화 과정. 국가장학금처럼 큰 사업이 온통청년에 없는 갈래이기도 합니다.",
  "금융·생활안정": "자산형성 통장, 대출이자, 자립수당, 결혼·출산 지원처럼 생활비를 받치는 돈입니다.",
  "문화·건강": "문화예술패스, 마음건강, 체육·여가. 건수에 비해 한 건 규모는 작습니다.",
  "참여·권리": "청년정책네트워크, 위원회, 국제교류. 예산보다 사람이 움직이는 갈래입니다.",
  "정책기반": "청년센터·공간 운영, 실태조사, 플랫폼. 청년이 직접 신청하지 않는 기반 사업이라 온통청년 등록 대상인지부터 정해야 합니다.",
};

export default function TypesPage() {
  const rows = TYPE_STYLES.map((t) => {
    const items = programs.filter((p) => p.type === t.key);
    const budget = items.reduce((s, p) => s + (p.budget ?? 0), 0);
    const regions = new Map<string, number>();
    for (const p of items) regions.set(p.region, (regions.get(p.region) ?? 0) + 1);
    const withBudget = items.filter((p) => p.budget != null);
    return {
      ...t,
      count: items.length,
      budget,
      share: budget / meta.budgetTotal,
      countShare: items.length / meta.total,
      avg: items.length ? budget / items.length : 0,
      biggest: [...withBudget].sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0))[0],
      topRegions: [...regions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }).sort((a, b) => b.budget - a.budget);

  const maxAvg = Math.max(...rows.map((r) => r.avg));
  const top = rows[0];
  const mostCommon = [...rows].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[760px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] md:text-[44px]">
        여덟 갈래. 크기 순서는 무엇을 세느냐에 달렸습니다.
      </h1>

      <p className="mt-5 max-w-[640px] text-[15px] leading-[1.85] text-ink-2">
        아래는 <b className="font-semibold text-ink">예산 순</b>입니다.
        사업 수로 줄을 세우면 순서가 뒤집혀{" "}
        <b className="font-semibold" style={{ color: mostCommon.fg }}>{mostCommon.label}</b>가 맨 앞으로 옵니다
        — {mostCommon.count}개로 전체의 {Math.round(mostCommon.countShare * 100)}%.
        반면 <b className="font-semibold" style={{ color: top.fg }}>{top.label}</b>{josa(top.label, "은는")}{" "}
        {top.count}개뿐인데 예산의 {Math.round(top.share * 100)}%를 씁니다.
      </p>

      <ol className="mt-12 border-t border-hair">
        {rows.map((t, i) => (
          <li key={t.key} className="border-b border-hair py-8">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,380px)] md:gap-12">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="tnum text-[12px] text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <span className="h-2.5 w-2.5" style={{ background: t.fill }} aria-hidden />
                  <h2 className="text-[22px] font-bold tracking-[-0.025em]" style={{ color: t.fg }}>
                    {t.label}
                  </h2>
                </div>

                <p className="mt-3 max-w-[560px] text-[14.5px] leading-[1.8] text-ink-2">
                  {BLURB[t.key]}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <span className="text-[12px] font-semibold text-ink-3">많은 지역</span>
                  {t.topRegions.map(([r, n]) => (
                    <Link
                      key={r}
                      href={`/notice/region/${REGION_SLUG[r]}`}
                      className="inline-flex items-baseline gap-1 border border-hair bg-card px-2.5 py-1 text-[12px] text-ink-2 transition-colors hover:bg-wash"
                    >
                      {r === "중앙" ? "중앙부처" : r}
                      <span className="tnum font-bold text-ink">{n}</span>
                    </Link>
                  ))}
                </div>

                {t.biggest && (
                  <p className="mt-4 text-[12.5px] text-ink-3">
                    가장 큰 사업 ·{" "}
                    <Link
                      href={`/notice/program/${t.biggest.id}`}
                      className="font-semibold text-ink-2 underline underline-offset-2 hover:text-ink"
                    >
                      {t.biggest.name}
                    </Link>{" "}
                    <span className="tnum">{formatBudget(t.biggest.budget)}원</span>
                  </p>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-5 self-start border-t border-hair pt-5 md:border-t-0 md:pt-0">
                <div>
                  <dt className="text-[11.5px] font-semibold text-ink-3">사업 수</dt>
                  <dd className="tnum mt-1 text-[24px] leading-none font-bold">{t.count}</dd>
                </div>
                <div>
                  <dt className="text-[11.5px] font-semibold text-ink-3">건당</dt>
                  <dd className="tnum mt-1 text-[24px] leading-none font-bold" style={{ color: t.fg }}>
                    {formatBudget(t.avg)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[11.5px] font-semibold text-ink-3">예산</dt>
                  <dd className="tnum mt-1 text-[28px] leading-none font-bold whitespace-nowrap">
                    {formatBudget(t.budget)}
                    <span className="tnum ml-2 text-[12px] font-semibold text-ink-3">
                      전체의 {(t.share * 100).toFixed(1)}%
                    </span>
                  </dd>
                </div>

                <div className="col-span-2 mt-1">
                  {/* Budget share as the bar, count share as the hairline. */}
                  <span className="relative block h-4 bg-wash">
                    <span
                      className="absolute inset-y-0 left-0"
                      style={{ width: `${t.share * 100}%`, background: t.fill }}
                    />
                    <span
                      className="absolute inset-y-0 left-0 border-r-2 border-ink/70"
                      style={{ width: `${t.countShare * 100}%` }}
                    />
                  </span>
                  <span className="mt-1.5 block text-[11px] leading-[1.5] text-ink-3">
                    막대 = 예산 비중 · 세로선 = 사업 수 비중
                  </span>

                  <span className="mt-3 block text-[11.5px] font-semibold text-ink-3">건당 규모</span>
                  <span className="mt-1 block h-2 bg-wash">
                    <span
                      className="block h-full"
                      style={{ width: `${(t.avg / maxAvg) * 100}%`, background: t.fill }}
                    />
                  </span>
                </div>

                <div className="col-span-2">
                  <Link
                    href={`/notice/list?type=${encodeURIComponent(t.key)}`}
                    className="text-[13px] font-semibold text-ink-2 hover:text-ink"
                  >
                    {t.count}개 목록 보기 →
                  </Link>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
