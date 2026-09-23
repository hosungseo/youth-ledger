import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { meta, programs, programsByRegion, sido } from "@/lib/data";
import {
  REGION_FULL, REGION_SLUG, SLUG_REGION, TYPE_STYLES,
  josa,
} from "@/lib/design";
import RegionTable from "@/components/RegionTable";
import RegionLocator from "@/components/RegionLocator";
import Crumbs from "@/components/Crumbs";

export function generateStaticParams() {
  return Object.values(REGION_SLUG).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const region = SLUG_REGION[(await params).slug];
  if (!region) return { title: "찾을 수 없는 지역" };
  const stat = meta.byRegion[region];
  return {
    title: `${REGION_FULL[region]} 청년정책`,
    description: `${REGION_FULL[region]}이 온통청년에 등록한 청년정책 ${stat?.count ?? 0}건.`,
  };
}


export default async function NoticeRegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const region = SLUG_REGION[(await params).slug];
  if (!region) notFound();

  const stat = meta.byRegion[region];
  const items = programsByRegion(region);
  const full = REGION_FULL[region];

  // 이 지역의 판 한 줄을 전국 열과 견준다.
  const cells = TYPE_STYLES.map((t) => {
    const mine = items.filter((p) => p.type === t.key);
    const national = programs.filter((p) => p.type === t.key);
    return {
      ...t,
      count: mine.length,
      budget: mine.reduce((s, p) => s + (p.budget ?? 0), 0),
      countShare: national.length ? mine.length / national.length : 0,
    };
  });
  const maxCell = Math.max(1, ...cells.map((c) => c.count));

  const ranked = Object.values(meta.byRegion)
    .filter((r) => r.region !== "중앙")
    .sort((a, b) => b.count - a.count);
  const rank = ranked.findIndex((r) => r.region === region) + 1;
  const openCount = items.filter((p) => p.status === "상시" || p.status === "진행중").length;
  const gov24Count = items.filter((p) => p.gov24).length;
  const budgetCount = items.filter((p) => p.budget != null).length;

  const lean = [...cells].filter((c) => c.count > 0).sort((a, b) => b.countShare - a.countShare)[0];
  const missing = cells.filter((c) => c.count === 0);


  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8">
      <Crumbs
        basis="notice"
        trail={[{ href: "/notice/plate", label: "판" }]}
        here={full}
      />

      <div className="mt-4 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:gap-14">
        <div>
          <h1 className="text-[34px] leading-[1.15] font-bold tracking-[-0.035em] md:text-[44px]">
            {full}
          </h1>

          <p className="mt-4 max-w-[560px] text-[15px] leading-[1.85] text-ink-2">
            {region === "중앙" ? (
              <>
                중앙부처가 온통청년에 등록한 청년정책 {stat.count.toLocaleString("ko-KR")}건입니다. 지역 제한 없이 신청할 수 있는 정책이 대부분입니다.
              </>
            ) : (
              <>
                {full}
                {josa(full, "와과")} 관내 시·군·구가 온통청년에 등록한 청년정책 {stat.count.toLocaleString("ko-KR")}건.
                등록 수로는 전국 <b className="font-semibold text-ink">{rank}위</b>입니다.
              </>
            )}{" "}
            지금 신청할 수 있는 것은 <b className="font-semibold text-ink">{openCount}건</b>, 보조금24 서비스와 이어지는 것은{" "}
            {gov24Count}건, 예산서 세부사업과 이어지는 것은 {budgetCount}건입니다.
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-5">
            {[
              ["정책 수", stat.count.toLocaleString("ko-KR"), "건"],
              ["신청 가능", String(openCount), "건"],
              ["주관 기관", String(stat.agencies.length), "곳"],
              ["빈 분야", String(missing.length), `/ ${TYPE_STYLES.length}`],
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

          {stat.agencies.length > 0 && (
            <div className="mt-8 border-t border-hair pt-6">
              <h2 className="text-[12px] font-semibold text-ink-3">사업을 여는 곳</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stat.agencies.map((a) => (
                  <span
                    key={a.name}
                    className="inline-flex items-baseline gap-1.5 border border-hair bg-card px-3 py-1.5 text-[12.5px] text-ink-2"
                  >
                    {a.name}
                    <span className="tnum font-semibold text-ink">{a.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {region !== "중앙" && (
          <figure className="lg:pt-1">
            <RegionLocator geo={sido} meta={meta} region={region} />
            <figcaption className="mt-2 text-[12px] leading-[1.6] text-ink-3">
              굵은 테두리가 {full}입니다. 색은 그 시도의 사업 수.
            </figcaption>
          </figure>
        )}
      </div>

      <section className="mt-14">
        <h2 className="text-[20px] font-bold tracking-[-0.025em]">이 지역의 한 줄</h2>
        <p className="mt-2 max-w-[620px] text-[13.5px] leading-[1.75] text-ink-2">
          첫 화면 판에서 {region === "중앙" ? "맨 윗줄" : `${region} 줄`}만 떼어낸 것입니다.
          막대는 이 지역 안에서 그 갈래가 차지하는 자리, 오른쪽 숫자는
          <b className="font-semibold text-ink"> 전국 물량 가운데 이 지역 몫</b>입니다.
          {lean && (
            <>
              {" "}여기선 <b className="font-semibold" style={{ color: lean.fg }}>{lean.label}</b>가
              가장 두드러집니다 — 전국 {Math.round(lean.countShare * 100)}%가 여기 있습니다.
            </>
          )}
        </p>

        <ul className="mt-6 border-t border-hair">
          {cells.map((c) => (
            <li key={c.key}>
              {c.count > 0 ? (
                <Link
                  href={`/notice/list?region=${encodeURIComponent(region)}&type=${encodeURIComponent(c.key)}`}
                  className="group grid grid-cols-[8.5rem_1fr_5.5rem] items-center gap-4 border-b border-hair py-3.5 md:grid-cols-[9.5rem_1fr_6rem_6rem]"
                >
                  <span className="truncate text-[13px] font-semibold group-hover:underline" style={{ color: c.fg }}>
                    {c.short}
                  </span>
                  <span className="relative h-5 bg-wash">
                    <span
                      className="absolute inset-y-0 left-0"
                      style={{ width: `${(c.count / maxCell) * 100}%`, background: c.fill }}
                    />
                  </span>
                  <span className="tnum hidden text-right text-[12.5px] text-ink-2 md:block">
                    전국의 {Math.round(c.countShare * 100)}%
                  </span>
                  <span className="tnum text-right text-[15px] font-bold">
                    {c.count}
                    <span className="ml-0.5 text-[11px] font-semibold text-ink-3">개</span>
                  </span>
                </Link>
              ) : (
                <div className="grid grid-cols-[8.5rem_1fr_5.5rem] items-center gap-4 border-b border-hair py-3.5 md:grid-cols-[9.5rem_1fr_6rem_6rem]">
                  <span className="truncate text-[13px] font-medium text-ink-3">{c.short}</span>
                  <span className="h-5 bg-wash-0" />
                  <span className="hidden text-right text-[12.5px] text-ink-3 md:block">—</span>
                  <span className="text-right text-[12.5px] text-ink-3">없음</span>
                </div>
              )}
            </li>
          ))}
        </ul>

        {missing.length > 0 && (
          <p className="mt-4 text-[12.5px] leading-[1.7] text-ink-3">
            {full}에는 {missing.map((m) => m.short).join(", ")} 분야 정책이 온통청년에 등록돼 있지 않습니다.
            중앙부처 사업으로는 신청할 수 있습니다 —{" "}
            <Link href="/notice/region/central" className="underline underline-offset-2 hover:text-ink">
              중앙부처 {meta.central}건 보기
            </Link>
          </p>
        )}
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">정책 {items.length.toLocaleString("ko-KR")}건</h2>
          <Link
            href={`/notice/list?region=${encodeURIComponent(region)}`}
            className="shrink-0 text-[13px] font-semibold text-ink-2 hover:text-ink"
          >
            조건 걸어 보기 →
          </Link>
        </div>
        <div className="mt-5">
          <RegionTable programs={items} />
        </div>
      </section>

      {region !== "중앙" && (
        <section className="mt-16 border-t border-hair pt-8">
          <h2 className="text-[12px] font-semibold text-ink-3">같은 지역, 재정 기준으로</h2>
          <p className="mt-2 max-w-[600px] text-[13px] leading-[1.75] text-ink-2">
            예산 자료로 보면 이 지역의 청년 세부사업은 훨씬 많고, 온통청년에 없는 사업과 집행률도 함께 볼 수 있습니다.
          </p>
          <Link
            href={`/fiscal/region/${REGION_SLUG[region]}`}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-hair bg-card px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:bg-wash"
          >
            {full} 재정 기준 →
          </Link>
        </section>
      )}

      <section className="mt-14 border-t border-hair pt-8">
        <h2 className="text-[12px] font-semibold text-ink-3">다른 지역</h2>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {["중앙", ...ranked.map((r) => r.region)]
            .filter((r) => r !== region)
            .map((r) => (
              <li key={r}>
                <Link
                  href={`/notice/region/${REGION_SLUG[r]}`}
                  className="inline-flex items-baseline gap-1.5 border border-hair bg-card px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:bg-wash"
                >
                  {r === "중앙" ? "중앙부처" : r}
                  <span className="tnum font-bold text-ink">{meta.byRegion[r]?.count ?? 0}</span>
                </Link>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}
