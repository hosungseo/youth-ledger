import Link from "next/link";
import { fiscal, fiscalPrograms, meta, programs } from "@/lib/data";
import { REGION_SLUG, TYPE_STYLES, formatBudget } from "@/lib/design";
import CompareTable, { type CompareRow } from "@/components/CompareTable";

// 설명에 숫자를 손으로 적어 두면 자료가 바뀔 때마다 조용히 틀린다.
// (1,519건으로 박혀 있던 것이 공개된 뒤에야 드러났다.)
export const metadata = {
  title: { absolute: "청년대장 — 2026 중앙·지방 청년정책" },
  description:
    `청년정책은 온통청년에 ${meta.total.toLocaleString("ko-KR")}건, ` +
    `예산 자료에 ${fiscal.meta.total.toLocaleString("ko-KR")}건이 잡힙니다. ` +
    "두 장부를 견주고, 온통청년에 없는 청년사업을 찾습니다.",
};

/** 광주·전남은 통합되어 한 행정구역이다. */
const GROUP: Record<string, string> = { 광주: "전남광주", 전남: "전남광주" };
const groupOf = (r: string) => GROUP[r] ?? r;

const REGION_ORDER = [
  "중앙", "서울", "부산", "대구", "인천", "전남광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "경북", "경남", "제주",
];

export default function Home() {
  const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0);

  const regionRows: CompareRow[] = REGION_ORDER.map((key) => {
    const n = programs.filter((p) => groupOf(p.region) === key);
    const f = fiscalPrograms.filter((p) => groupOf(p.region) === key);
    return {
      key,
      label: key === "중앙" ? "중앙부처" : key,
      href: key === "전남광주" || key === "중앙" ? null : `/notice/region/${REGION_SLUG[key]}`,
      noticeCount: n.length,
      noticeBudget: sum(n, (p) => p.budget ?? 0),
      fiscalCount: f.length,
      fiscalBudget: sum(f, (p) => p.budget),
      // 중앙은 공고가 공모사업, 재정이 그 위 예산·기금 줄이라 금액이 겹친다.
      budgetComparable: false, // 온통청년에는 예산 항목이 없다
    };
  });

  const typeRows: CompareRow[] = TYPE_STYLES.map((t) => {
    const n = programs.filter((p) => p.type === t.key);
    const f = fiscalPrograms.filter((p) => p.type === t.key);
    return {
      key: t.key,
      label: t.label,
      href: `/notice/list?type=${encodeURIComponent(t.key)}`,
      color: t.fill,
      noticeCount: n.length,
      noticeBudget: sum(n, (p) => p.budget ?? 0),
      fiscalCount: f.length,
      fiscalBudget: sum(f, (p) => p.budget),
      budgetComparable: false, // 유형별 합계에는 중앙이 섞여 있다
    };
  });

  const localNotice = programs.filter((p) => p.section === "local");
  const localFiscal = fiscalPrograms.filter((p) => p.level === "local");
  const localFiscalBudget = sum(localFiscal, (p) => p.budget);
  const localFiscalIn = localFiscal.filter((p) => p.inOnthong).length;
  const est = fiscal.meta.absentEstimate;

  const widest = [...regionRows]
    .filter((r) => r.key !== "중앙" && r.noticeCount > 0)
    .sort((a, b) => b.fiscalCount / b.noticeCount - a.fiscalCount / a.noticeCount)[0];
  const inverted = regionRows.filter(
    (r) => r.noticeCount > 0 && r.fiscalCount < r.noticeCount,
  );

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[820px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
        청년정책은 몇 개일까요.
        <br />
        온통청년과 예산서의 답이 다릅니다.
      </h1>

      <p className="mt-6 max-w-[660px] text-[15.5px] leading-[1.85] text-ink-2">
        하나는 국무조정실이 운영하는 <b className="font-semibold text-ink">온통청년</b>, 중앙부처와
        지자체가 직접 등록한 청년정책 목록입니다. 다른 하나는{" "}
        <b className="font-semibold text-ink">예산 자료</b>, 지방재정365와 열린재정에 청년이라는
        이름으로 잡혀 있는 세부사업입니다. 예산은 잡혀 있는데 온통청년에는 없는 사업이 적지 않고,
        온통청년에는 예산·집행 항목이 아예 없습니다.{" "}
        <b className="font-semibold text-ink">두 장부를 한 화면에서 잇는 것</b>이 이 대장의 목적입니다.
      </p>

      {/*
        갈림길. 문짝이 그 뒤 방의 색을 그대로 입고 있어서, 누르기 전에 어디로
        들어가는지 보인다 — 공고는 흰 종이, 재정은 검은 판이다.
      */}
      <div className="mt-11 grid gap-4 md:grid-cols-2">
        <Door
          href="/notice/plate"
          eyebrow="온통청년 기준"
          count={meta.total}
          unit="건 청년정책"
          budget={`지금 신청 가능 ${(meta.open ?? 0).toLocaleString("ko-KR")}건 · 보조금24 연결 ${(meta.withGov24 ?? 0).toLocaleString("ko-KR")}건`}
          budgetNote={`예산 항목이 없어, 예산서와 이어지는 ${(meta.withBudget ?? 0).toLocaleString("ko-KR")}건에만 금액을 붙였습니다`}
          blurb="기관이 청년정책으로 등록한 것을 봅니다. 지원대상·신청기간·소관기관이 붙어 있고, 보조금24 서비스와 이어지는 정책은 바로 건너갈 수 있습니다."
          bullets={["지역·분야·신청시기로 좁히기", "정책마다 상세 페이지(보조금24·예산 연결)", "다른 지역의 비슷한 정책과 나란히"]}
          tone="paper"
        />
        <Door
          href="/fiscal/plate"
          eyebrow="재정 기준"
          count={fiscal.meta.total}
          unit="건 청년 세부사업"
          budget={`예산현액 ${formatBudget(fiscal.meta.budgetTotal)}원`}
          budgetNote={`온통청년에 대응 정책이 있는 것 ${(fiscal.meta.inOnthong ?? 0).toLocaleString("ko-KR")}건(자동 판정)`}
          blurb="예산서에 잡힌 청년사업을 그대로 봅니다. 온통청년에 등록되지 않은 사업까지 들어 있고, 온통청년에는 없는 집행률이 붙습니다."
          bullets={["온통청년에 없는 사업 걸러 보기", "9월 21일 기준 집행률", "분야·지역·기관별로 갈라 보기"]}
          tone="ink"
        />
      </div>

      <p className="mt-4 text-[12.5px] leading-[1.7] text-ink-3">
        들어가면 바탕색이 바뀝니다. 흰 바탕이면 온통청년을, 검은 바탕이면 예산을 보고
        있는 것입니다. 한 정책이 광역·시군 예산으로 나뉘어 여러 세부사업이 되기도 하므로
        건수 차이가 곧 누락 수는 아닙니다. 실제로 온통청년에 없는 비율은 표본 검토로 따로 추정했습니다.
      </p>

      <Link
        href="/link"
        className="group mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-hair bg-card p-6 transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]"
      >
        <span>
          <span className="block text-[12px] font-semibold text-ink-3">종합 · 다섯 장부를 한 장에</span>
          <span className="mt-1 block text-[18px] font-bold tracking-[-0.02em]">
            청년 1인당 예산 지도, 온통청년 등록의 광역 격차, 재원 구성, 청년 나이 정의
          </span>
          <span className="mt-1 block text-[13px] text-ink-2">
            온통청년 · 보조금24 · 지방재정365 · 열린재정 · KOSIS 인구를 시·군·구 단위로 묶었습니다.
          </span>
        </span>
        <span className="text-[14px] font-semibold" aria-hidden>
          종합 보기 <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </span>
      </Link>

      {/* Local governments: same layer on both sides (individual programs). */}
      <section className="mt-14 rounded-[20px] border border-hair bg-card p-7 md:p-9">
        <h2 className="text-[13px] font-semibold text-ink-3">지방자치단체만 견주면</h2>
        <p className="mt-3 max-w-[660px] text-[15px] leading-[1.8]">
          온통청년에 지자체가 등록한 청년정책은 <b className="font-semibold">{localNotice.length.toLocaleString("ko-KR")}건</b>,
          지자체 예산서에 청년 이름으로 잡힌 세부사업은{" "}
          <b className="font-semibold">{localFiscal.length.toLocaleString("ko-KR")}건</b>{" "}
          <b className="font-semibold">{formatBudget(localFiscalBudget)}원</b>입니다.
          {est && (
            <>
              {" "}표본 {est.sample}건을 검토해 보니, 청년 세부사업의{" "}
              <b className="font-semibold text-ink">약 {est.absentShare}%</b>(95% 구간 {est.ci[0]}~{est.ci[1]}%)는
              온통청년에 대응하는 정책이 없었습니다.
            </>
          )}
        </p>

        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-[12px] font-semibold text-ink-3">사업 수</p>
            <div className="mt-2.5 space-y-2">
              {[
                { name: "온통청년", v: localNotice.length, bg: "bg-ink" },
                { name: "예산 자료", v: localFiscal.length, bg: "bg-t-biz" },
              ].map((bar) => (
                <div key={bar.name} className="flex items-center gap-3">
                  <span className="w-[4.5rem] shrink-0 text-[12px] text-ink-2">{bar.name}</span>
                  <span className="relative h-6 flex-1 bg-wash">
                    <span
                      className={`absolute inset-y-0 left-0 ${bar.bg}`}
                      style={{ width: `${(bar.v / Math.max(localNotice.length, localFiscal.length)) * 100}%` }}
                    />
                  </span>
                  <span className="tnum w-[6.5rem] shrink-0 text-right text-[13px] font-bold">
                    {bar.v.toLocaleString("ko-KR")}건
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-ink-3">예산 자료의 청년 세부사업</p>
            <div className="mt-2.5 space-y-2">
              {[
                { name: "온통청년 있음", v: localFiscalIn, bg: "bg-ink" },
                { name: "온통청년 없음", v: localFiscal.length - localFiscalIn, bg: "bg-t-biz" },
              ].map((bar) => (
                <div key={bar.name} className="flex items-center gap-3">
                  <span className="w-[5.5rem] shrink-0 text-[12px] text-ink-2">{bar.name}</span>
                  <span className="relative h-6 flex-1 bg-wash">
                    <span
                      className={`absolute inset-y-0 left-0 ${bar.bg}`}
                      style={{ width: `${(bar.v / localFiscal.length) * 100}%` }}
                    />
                  </span>
                  <span className="tnum w-[6.5rem] shrink-0 text-right text-[13px] font-bold">
                    {bar.v.toLocaleString("ko-KR")}건
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] text-ink-3">자동 판정(표본 검토 기준 약 72% 정확)</p>
          </div>
        </div>
      </section>

      {/* Why the central row cannot be added up. */}
      <section className="mt-8 rounded-[20px] border border-dashed border-hair bg-paper p-7">
        <h2 className="text-[13px] font-semibold text-ink-3">중앙은 건수로 견줄 수 없습니다</h2>
        <p className="mt-3 max-w-[660px] text-[14.5px] leading-[1.85] text-ink-2">
          중앙은 두 자료가 <b className="font-semibold text-ink">서로 다른 층위</b>를 봅니다.
          온통청년은 정책 하나하나를(같은 사업이 연도·부서별로 여러 번 등록되기도 합니다), 열린재정은
          그것들을 묶는 세부사업을 싣습니다({"'청년일자리창출지원'"} 9,251억 안에{" "}
          {"'청년일자리도약장려금'"}). 그래서 중앙은 세부사업 한 건씩 온통청년과 대조했고,{" "}
          <b className="font-semibold text-ink">맞춤형 국가장학금(5.1조 원)</b>처럼 청년이 주 대상인데
          온통청년에 없는 사업을 재정 기준 목록에서 표시해 두었습니다.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">지역별</h2>
        <p className="mt-2 max-w-[640px] text-[13.5px] leading-[1.75] text-ink-2">
          온통청년에 얼마나 등록됐는지는 지역마다 크게 다릅니다.
          {widest && (
            <>
              {" "}가장 벌어진 곳은 <b className="font-semibold text-ink">{widest.label}</b>로,
              온통청년 {widest.noticeCount}건인데 예산 자료에는{" "}
              {widest.fiscalCount.toLocaleString("ko-KR")}건 —{" "}
              {(widest.fiscalCount / widest.noticeCount).toFixed(0)}배입니다.
            </>
          )}
        </p>
        <div className="mt-6">
          <CompareTable rows={regionRows} unit="지역" />
        </div>

        {inverted.length > 0 && (
          <p className="mt-5 max-w-[660px] rounded-[16px] border border-hair bg-card p-5 text-[13px] leading-[1.8] text-ink-2">
            <b className="font-semibold text-ink">배수가 1보다 작은 칸도 결함의 표시입니다.</b>{" "}
            {inverted.map((r) => r.label).join(", ")}
            {inverted.length === 1 ? "은" : "는"} 온통청년에 등록된 수가 예산 자료에 잡힌 것보다 많습니다.
            같은 정책을 모집 차수·연도별로 따로 등록했거나, 예산서 사업명에 청년이 드러나지 않거나,
            행사·공고 단위로 잘게 등록한 경우입니다.
          </p>
        )}
      </section>

      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">분야별</h2>
        <p className="mt-2 max-w-[640px] text-[13.5px] leading-[1.75] text-ink-2">
          온통청년 분야는 등록 분류를 옮긴 것이고, 재정 기준 분야는 사업명으로 추정한 값입니다.
          이름에 단서가 없는 센터·공간·운영비는 정책기반으로 몰립니다. 분야별 배수는 그 점을 감안해서 보세요.
        </p>
        <div className="mt-6">
          <CompareTable rows={typeRows} unit="분야" />
        </div>
      </section>

      <p className="mt-16 border-t border-hair pt-6 text-[12px] leading-[1.8] text-ink-3">
        온통청년 기준 출처 · {meta.source}
        <br />
        재정 기준 출처 · {fiscal.meta.source}
        <br />
        재정 기준의 한계(분야 추정, 자동 판정의 정확도, 통합 광역 처리)는{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-ink">
          자료 페이지
        </Link>
        에 적어 두었습니다.
      </p>
    </div>
  );
}

function Door({
  href,
  eyebrow,
  count,
  unit,
  budget,
  budgetNote,
  blurb,
  bullets,
  tone,
}: {
  href: string;
  eyebrow: string;
  count: number;
  unit: string;
  budget: string;
  budgetNote?: string;
  blurb: string;
  bullets: string[];
  tone: "paper" | "ink";
}) {
  // 홈은 늘 밝은 바탕이므로 검은 문짝은 토큰이 아니라 제 색을 직접 든다.
  const ink = tone === "ink";
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-[20px] border p-7 transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)] ${
        ink ? "border-[#0e0f12] bg-[#0e0f12] text-white" : "border-hair bg-card"
      }`}
    >
      <div>
        <span className={`text-[12px] font-semibold ${ink ? "text-white/55" : "text-ink-3"}`}>
          {eyebrow}
        </span>
        <p className="tnum mt-3 text-[40px] leading-none font-bold tracking-[-0.03em]">
          {count.toLocaleString("ko-KR")}
          <span
            className={`ml-1.5 text-[15px] font-semibold ${ink ? "text-white/70" : "text-ink-2"}`}
          >
            {unit}
          </span>
        </p>
        <p className={`tnum mt-2 text-[13px] ${ink ? "text-white/60" : "text-ink-3"}`}>{budget}</p>
        {budgetNote && (
          <p
            className={`mt-1 text-[11.5px] leading-[1.55] ${ink ? "text-white/45" : "text-ink-3/80"}`}
          >
            {budgetNote}
          </p>
        )}

        <p className={`mt-5 text-[14px] leading-[1.75] ${ink ? "text-white/85" : "text-ink-2"}`}>
          {blurb}
        </p>

        <ul className="mt-4 space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className={`flex gap-2.5 text-[12.5px] ${ink ? "text-white/70" : "text-ink-3"}`}>
              <span
                className={`mt-[7px] h-1 w-1 shrink-0 rounded-full ${ink ? "bg-t-biz" : "bg-ink"}`}
                aria-hidden
              />
              {b}
            </li>
          ))}
        </ul>
      </div>

      <span
        className={`mt-8 inline-flex items-center gap-2 text-[14px] font-semibold ${
          ink ? "text-t-biz" : "text-ink"
        }`}
      >
        이 기준으로 들어가기
        <span className="transition-transform group-hover:translate-x-1" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
