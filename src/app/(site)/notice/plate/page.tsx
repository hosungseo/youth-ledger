import Link from "next/link";
import { fiscal, meta, programs, sido } from "@/lib/data";
import { REGION_FULL, REGION_SLUG, TYPE_STYLES, formatBudget, josa } from "@/lib/design";
import Plate, { type Row } from "@/components/matrix/Plate";
import MapView from "@/components/MapView";
import MonthStrip from "@/components/MonthStrip";

export const metadata = {
  title: "판",
  description:
    "온통청년 청년정책을 중앙부처와 시도, 분야 여덟 칸으로 펼친 판.",
};

// 광주광역시와 전라남도는 통합되었다. 지도는 둘을 따로 그리지만 지금의
// 행정구역은 하나이므로 한 줄로 묶고, 눌러서 각각을 펼칠 수 있게 둔다.
const MERGED = { key: "전남광주", label: "전남광주", parts: ["광주", "전남"] };

const REGION_ORDER = [
  "중앙", "서울", "부산", "대구", "인천", MERGED.key, "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "경북", "경남", "제주",
];

export default function NoticePlatePage() {
  const cellsFor = (items: typeof programs) =>
    TYPE_STYLES.map((t) => {
      const inCell = items.filter((p) => p.type === t.key);
      return {
        count: inCell.length,
        budget: inCell.reduce((s, p) => s + (p.budget ?? 0), 0),
        unknown: inCell.filter((p) => p.budget == null).length,
      };
    });

  const itemsOf = (region: string) =>
    region === MERGED.key
      ? programs.filter((p) => MERGED.parts.includes(p.region))
      : programs.filter((p) => p.region === region);

  const rows: Row[] = REGION_ORDER.map((region) => {
    const items = itemsOf(region);
    const row: Row = {
      key: region,
      label: region === "중앙" ? "중앙부처" : region,
      kind: "region",
      slug: REGION_SLUG[region],
      count: items.length,
      budget: items.reduce((s, p) => s + (p.budget ?? 0), 0),
      cells: cellsFor(items),
    };

    if (region === MERGED.key) {
      row.children = MERGED.parts.map((part) => {
        const sub = programs.filter((p) => p.region === part);
        return {
          key: part,
          label: REGION_FULL[part] ?? part,
          kind: "region" as const,
          slug: REGION_SLUG[part],
          count: sub.length,
          budget: sub.reduce((s, p) => s + (p.budget ?? 0), 0),
          cells: cellsFor(sub),
        };
      });
    }

    // 중앙부처 is not one office — fifteen ministries sit behind that single
    // line, and one of them holds most of the money. Let the row open up.
    if (region === "중앙") {
      const byMinistry = new Map<string, typeof programs>();
      for (const p of items) {
        byMinistry.set(p.agency, [...(byMinistry.get(p.agency) ?? []), p]);
      }
      row.children = [...byMinistry.entries()]
        .map(([name, list]) => ({
          key: `중앙:${name}`,
          label: name,
          kind: "ministry" as const,
          count: list.length,
          budget: list.reduce((s, p) => s + (p.budget ?? 0), 0),
          cells: cellsFor(list),
        }))
        .sort((a, b) => b.budget - a.budget || b.count - a.count);
    }

    return row;
  });

  // The headline finding, computed rather than asserted.
  const byType = TYPE_STYLES.map((t) => {
    const items = programs.filter((p) => p.type === t.key);
    const budget = items.reduce((s, p) => s + (p.budget ?? 0), 0);
    return { ...t, count: items.length, budget, share: budget / meta.budgetTotal };
  });
  const topBudget = [...byType].sort((a, b) => b.budget - a.budget)[0];

  const empties = rows.reduce(
    (n, r) => n + r.cells.filter((c) => c.count === 0).length,
    0,
  );

  // The count view and the budget view disagree about who runs 청년정책.
  const central = programs.filter((p) => p.section === "central");
  const local = programs.filter((p) => p.section === "local");
  const sum = (xs: typeof programs) => xs.reduce((s, p) => s + (p.budget ?? 0), 0);
  const centralBudget = sum(central);
  const localBudget = sum(local);
  const centralShare = centralBudget / (centralBudget + localBudget);
  const perCentral = centralBudget / central.length;
  const perLocal = localBudget / local.length;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
        <h1 className="max-w-[780px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
          청년정책 {meta.total.toLocaleString("ko-KR")}건이
          <br />
          어디에, 어떤 모양으로 놓여 있는가.
        </h1>

        <p className="mt-5 max-w-[640px] text-[15px] leading-[1.8] text-ink-2">
          온통청년에 중앙부처 {meta.central}건과 지방자치단체 {meta.local.toLocaleString("ko-KR")}건이 등록돼 있습니다.
          이걸 중앙부처와 시도 {rows.length - 1}줄, 분야 {TYPE_STYLES.length}칸으로 펼치면{" "}
          {rows.length * TYPE_STYLES.length}칸의 판이 나옵니다.
          그 가운데 <b className="font-semibold text-ink">{empties}칸이 비어 있습니다.</b>{" "}
          맨 윗줄 <b className="font-semibold text-ink">중앙부처</b>는 한 곳이 아니라{" "}
          {rows[0].children?.length}개 부처이고,{" "}
          <b className="font-semibold text-ink">전남광주</b>는 통합된 한 시도입니다. 둘 다 눌러서 펼쳐 볼 수 있습니다.
        </p>

        <div className="mt-12" id="plate">
          <Plate
            data={{
              basis: "notice",
              rows,
              note: "가로는 분야 여덟, 세로는 중앙부처와 시도. 칸의 진하기가 그 줄·그 분야에 등록된 무게입니다. 예산은 예산서와 이어지는 정책에만 붙어 있어, 건수로 보는 것이 정확합니다.",
            }}
          />
        </div>

        {/* 시기는 판의 축이 아니다. 공고 기준에만 있는 정보라 여기서 따로 보인다. */}
        {(
          <section className="mt-16 border-t border-hair pt-10">
            <h2 className="text-[20px] font-bold tracking-[-0.025em]">언제 신청하나</h2>
            <p className="mt-2 max-w-[620px] text-[13.5px] leading-[1.75] text-ink-2">
              2026년 신청기간이 걸친 달로 셌습니다. 1~3월에{" "}
              <b className="font-semibold text-ink">
                {meta.monthHistogram.slice(0, 3).reduce((s, m) => s + m.count, 0).toLocaleString("ko-KR")}건
              </b>
              이 열립니다. 지금 신청할 수 있는 정책(상시·진행중)은 {(meta.open ?? 0).toLocaleString("ko-KR")}건뿐입니다.
            </p>
            <div className="mt-6">
              <MonthStrip
                histogram={meta.monthHistogram}
                always={meta.alwaysOpen}
                alreadyAnnounced={meta.alreadyAnnounced}
                undecided={meta.undecided}
              />
            </div>
          </section>
        )}

        {/* The plate orders regions by name; only the map shows where they are. */}
        <section className="mt-16 border-t border-hair pt-10">
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">지도로 보기</h2>
          <p className="mt-2 max-w-[620px] text-[13.5px] leading-[1.75] text-ink-2">
            같은 숫자를 지리에 얹은 것입니다. 분야를 고르면 그 갈래가 어디에 몰려 있는지
            드러납니다 — 판에서는 열을 훑어야 보이던 것이 한눈에 들어옵니다.
          </p>
          <div className="mt-7">
            <MapView geo={sido} meta={meta} />
          </div>
        </section>

        {/* What the fiscal basis adds, and what it cannot be trusted for. */}
        <section className="mt-10 border-t border-hair pt-8">
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">
            온통청년에 등록된 것이 전부가 아닙니다.
          </h2>
          <p className="mt-3 max-w-[640px] text-[14.5px] leading-[1.85] text-ink-2">
            온통청년은 기관이 직접 등록한 정책만 싣습니다. 예산 자료를 열어 보면 청년이라는 이름이
            붙은 세부사업이 훨씬 많습니다 — 지방재정365와 열린재정 기준으로{" "}
            <b className="font-semibold text-ink">{fiscal.meta.total.toLocaleString("ko-KR")}건</b>이고,
            그 가운데 상당수는 온통청년에 대응하는 정책이 없습니다.
            위 판의 <b className="font-semibold text-ink">재정 기준</b>이 그 그림입니다.
          </p>

          <ul className="mt-5 max-w-[720px] space-y-2">
            {fiscal.meta.caveats.map((c) => (
              <li key={c} className="flex gap-2.5 text-[13px] leading-[1.7] text-ink-3">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                <span>{c}</span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[12.5px] text-ink-3">
            출처 · {fiscal.meta.source} ·{" "}
            <Link href="/about" className="underline underline-offset-2 hover:text-ink">
              분류 규칙과 한계
            </Link>
          </p>
        </section>

        {/* What flipping the mode exposes: the two views disagree. */}
        <section className="mt-16 border-t border-hair pt-10">
          <h2 className="max-w-[720px] text-[26px] leading-[1.3] font-bold tracking-[-0.03em] md:text-[32px]">
            사업을 세면 지방이 {Math.round((local.length / meta.total) * 100)}%,
            돈을 세면 중앙이 {Math.round(centralShare * 100)}%.
          </h2>

          <p className="mt-4 max-w-[640px] text-[15px] leading-[1.85] text-ink-2">
            판을 <b className="font-semibold text-ink">예산</b>으로 바꿔 보세요.
            열일곱 줄이 한꺼번에 희미해지고 맨 윗줄만 남습니다.
            지방자치단체 {local.length}개 사업이 나눠 갖는 돈은 {formatBudget(localBudget)}원,
            중앙부처 {central.length}개 사업이 쥔 돈은 {formatBudget(centralBudget)}원입니다.
            한 사업에 실리는 무게가 <b className="font-semibold text-ink">{Math.round(perCentral / perLocal)}배</b> 차이 납니다.
          </p>

          <div className="mt-9 grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:gap-14">
            {/* Two bars, same scale: count against money. */}
            <div className="space-y-7">
              {[
                { label: "사업 수", a: central.length, b: local.length, fmt: (n: number) => `${n}개` },
                { label: "예산", a: centralBudget, b: localBudget, fmt: (n: number) => `${formatBudget(n)}원` },
              ].map((row) => {
                const total = row.a + row.b;
                return (
                  <div key={row.label}>
                    <p className="text-[12px] font-semibold text-ink-3">{row.label}</p>
                    <div className="mt-2 flex h-11 w-full overflow-hidden">
                      <span
                        className="flex items-center justify-start bg-ink pl-3 text-[12.5px] font-semibold text-onink"
                        style={{ width: `${(row.a / total) * 100}%` }}
                      >
                        {(row.a / total) * 100 > 15 && "중앙부처"}
                      </span>
                      <span
                        className="flex items-center justify-start bg-wash-2 pl-3 text-[12.5px] font-semibold text-ink-2"
                        style={{ width: `${(row.b / total) * 100}%` }}
                      >
                        {(row.b / total) * 100 > 15 && "지방자치단체"}
                      </span>
                    </div>
                    <div className="mt-1.5 flex justify-between text-[12px] text-ink-2">
                      <span className="tnum">{row.fmt(row.a)}</span>
                      <span className="tnum">{row.fmt(row.b)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <ol className="space-y-2.5">
              <li className="mb-3 text-[12px] font-semibold text-ink-3">유형별 예산 비중</li>
              {[...byType]
                .sort((a, b) => b.budget - a.budget)
                .map((t) => (
                  <li key={t.key}>
                    <Link
                      href={`/notice/list?type=${encodeURIComponent(t.key)}`}
                      className="group grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3"
                    >
                      <span
                        className="truncate text-[12.5px] font-semibold group-hover:underline"
                        style={{ color: t.fg }}
                      >
                        {t.short}
                      </span>
                      <span className="relative h-4 bg-wash">
                        <span
                          className="absolute inset-y-0 left-0"
                          style={{ width: `${t.share * 100}%`, background: t.fill }}
                        />
                        <span
                          className="absolute inset-y-0 left-0 border-r-2 border-ink/70"
                          style={{ width: `${(t.count / meta.total) * 100}%` }}
                        />
                      </span>
                      <span className="tnum text-right text-[12px] text-ink-2">
                        {Math.round(t.share * 100)}%
                      </span>
                    </Link>
                  </li>
                ))}
              <li className="pt-2 text-[11.5px] leading-[1.65] text-ink-3">
                막대 = 예산 비중, 세로선 = 사업 수 비중.
                선이 막대보다 오른쪽이면 작은 사업이 여럿이라는 뜻입니다.{" "}
                <b className="font-semibold text-ink-2">{topBudget.label}</b>{josa(topBudget.label, "은는")}{" "}
                그 반대입니다 — {topBudget.count}개로 {Math.round(topBudget.share * 100)}%.
              </li>
            </ol>
          </div>
        </section>
    </div>
  );
}
