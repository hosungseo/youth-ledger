import type { Metadata } from "next";
import Link from "next/link";
import { fiscal, link, meta } from "@/lib/data";
import { MAP_H, MAP_W, sidoOutlines, sigunguShapes } from "@/lib/project";
import SigunguMap from "@/components/link/SigunguMap";
import StackedBars, { type Series } from "@/components/link/StackedBars";
import StripChart, { type StripRow } from "@/components/link/StripChart";

export const metadata: Metadata = {
  title: "종합",
  description: "온통청년·보조금24·지방재정365·열린재정·KOSIS 인구를 지자체 단위로 묶어, 청년 1인당 예산과 온통청년의 빈자리를 지도로 봅니다.",
};

// reference categorical slots (validated: adjacent CVD ΔE ≥ 9.1, light surface)
const C1 = "#2a78d6";
const C2 = "#eb6834";
const C3 = "#1baf7a";
const C4 = "#eda100";
const GRAY = "#b9b9b3";

const eok = (v: number) =>
  v >= 1e4 ? `${(v / 1e4).toFixed(1)}조` : `${Math.round(v).toLocaleString("ko-KR")}억`;
const man = (won: number) => `${Math.round(won / 1e4).toLocaleString("ko-KR")}만 원`;
const ym = (s: string) => `${s.slice(0, 4)}.${Number(s.slice(4, 6))}`;

export default function LinkPage() {
  const shapes = sigunguShapes();
  const outlines = sidoOutlines();
  const L = link;
  const local = fiscal.meta;
  const cf = L.coverageFiscal;
  const localBudget = L.units.reduce((s, u) => s + u.budget, 0);
  const perYouthNational = (localBudget * 1e8) / L.nationalYouthPop;
  const est = local.absentEstimate;
  const kindEst = est?.byKind;
  const g24 = L.gov24Absence;
  const cp = L.coveragePolicy;
  const centralBdg = Object.values(cf["중앙"]).reduce((s, v) => s + v.bdg, 0);
  const localN = Object.values(cf["지방"]).reduce((s, v) => s + v.n, 0);

  const sidoRows = L.sido.filter((s) => s.budgetPerYouth);
  const perYouthMax = Math.max(...sidoRows.map((s) => s.budgetPerYouth ?? 0));
  const ageOrder = ["29", "34", "39", "45", "49", "제한 없음", "기타"];

  // 시군구 with enough programs to form a share; grouped by 광역, ordered by median
  const eligible = L.units.filter((u) => u.local !== "본청" && u.programs >= 5 && u.budgetPerYouth);
  const med = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const stripRows: StripRow[] = [...new Set(eligible.map((u) => u.sido))]
    .map((sd) => {
      const pts = eligible
        .filter((u) => u.sido === sd)
        .map((u) => ({ id: u.code, name: u.name, value: u.absent / u.programs, note: `청년 세부사업 ${u.programs}건 · 1인당 ${man(u.budgetPerYouth ?? 0)}` }));
      return { key: sd, label: sd, median: med(pts.map((p) => p.value)), points: pts };
    })
    .sort((a, b) => b.median - a.median);
  // Spearman rank correlation: per-youth budget vs. absent share (does money predict registration?)
  const rankOf = (v: number[]) => {
    const idx = v.map((x, i) => [x, i] as const).sort((a, b) => a[0] - b[0]);
    const r = new Array<number>(v.length);
    idx.forEach(([, i], k) => (r[i] = k));
    return r;
  };
  const ra = rankOf(eligible.map((u) => u.budgetPerYouth ?? 0));
  const rb = rankOf(eligible.map((u) => u.absent / u.programs));
  const mean = (ra.length - 1) / 2;
  const cov = ra.reduce((s, a, i) => s + (a - mean) * (rb[i] - mean), 0);
  const varr = ra.reduce((s, a) => s + (a - mean) ** 2, 0);
  const rho = cov / varr;
  // share of the 시군구 variance that the 광역 alone explains (η²)
  const shares = eligible.map((u) => u.absent / u.programs);
  const grand = shares.reduce((a, b) => a + b, 0) / shares.length;
  const ssTotal = shares.reduce((a, v) => a + (v - grand) ** 2, 0);
  const ssBetween = stripRows.reduce((a, r) => {
    const m = r.points.reduce((x, p) => x + p.value, 0) / r.points.length;
    return a + r.points.length * (m - grand) ** 2;
  }, 0);
  const eta2 = ssTotal ? ssBetween / ssTotal : 0;
  const ageMax = Math.max(...Object.values(L.ageAll));

  const coverSeries: Series[] = [
    { key: "both", label: "보조금24·예산 둘 다", color: C1 },
    { key: "gov24Only", label: "보조금24만", color: C3, onColor: "#0b0b0b" },
    { key: "budgetOnly", label: "예산서만", color: C4, onColor: "#0b0b0b" },
    { key: "none", label: "어느 쪽과도 연결 안 됨", color: GRAY, onColor: "#0b0b0b" },
  ];
  const fundSeries: Series[] = [
    { key: "국비", label: "국비", color: C1 },
    { key: "시도비", label: "시·도비", color: C2 },
    { key: "시군구비", label: "시·군·구비", color: C3, onColor: "#0b0b0b" },
    { key: "기타", label: "기타", color: C4, onColor: "#0b0b0b" },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[820px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
        다섯 장부를 한 장에.
        <br />
        청년 한 사람에게 얼마가 닿나.
      </h1>
      <p className="mt-5 max-w-[680px] text-[15px] leading-[1.85] text-ink-2">
        온통청년을 가운데 두고 보조금24(자격·신청), 지방재정365(지자체 예산·집행·재원), 열린재정(중앙 예산),
        KOSIS 주민등록인구(20~39세)를 지자체 단위로 묶었습니다. 서로를 가리키는 공통 번호가 없어 기관코드·이름·대상
        지역으로 이었고, 연결의 정확도는{" "}
        <Link href="/about" className="font-semibold underline underline-offset-2 hover:text-ink">
          자료 페이지
        </Link>
        에 적었습니다.
      </p>

      {/* hub: 온통청년 at the centre, four ledgers around it */}
      <section className="mt-10 grid gap-3 md:grid-cols-[1fr_1.1fr_1fr] md:items-stretch" aria-label="다섯 자료의 연결">
        <div className="grid gap-3">
          <Node name="보조금24" value={`${meta.withGov24?.toLocaleString("ko-KR")}건 연결`} note="서비스ID · 자격조건 표준코드" />
          <Node name="열린재정" value={`${cf["중앙"] ? Object.values(cf["중앙"]).reduce((s, v) => s + v.n, 0) : 0}개 · ${eok(centralBdg)} 원`} note="중앙 청년 세부사업" />
        </div>
        <div className="relative flex flex-col justify-center rounded-[20px] bg-ink p-7 text-onink">
          <span className="text-[12px] font-semibold opacity-60">가운데 · 온통청년</span>
          <span className="tnum mt-2 text-[44px] leading-none font-bold tracking-[-0.03em]">{meta.total.toLocaleString("ko-KR")}</span>
          <span className="mt-1 text-[14px] opacity-80">건 청년정책</span>
          <span className="mt-4 text-[12.5px] leading-[1.7] opacity-70">
            예산·집행·재원·인구 항목이 없어, 나머지 네 장부에서 끌어와 붙입니다.
          </span>
        </div>
        <div className="grid gap-3">
          <Node name="지방재정365" value={`${localN.toLocaleString("ko-KR")}개 · ${eok(localBudget)} 원`} note={`지자체 청년 세부사업 · 집행 ${ym(L.asof.local)}`} />
          <Node name="KOSIS 주민등록인구" value={`청년 ${Math.round(L.nationalYouthPop / 1e4).toLocaleString("ko-KR")}만 명`} note={`20~39세 · ${ym(L.asof.population)} 기준`} />
        </div>
      </section>

      {/* KPI row */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi value={man(perYouthNational)} label="청년 1인당 지방 청년 예산" note="지자체 청년 세부사업 ÷ 20~39세" />
        <Kpi value={est ? `약 ${est.absentShare}%` : "—"} label="온통청년에 없는 지방 청년사업" note={est ? `표본 추정 · 95% 구간 ${est.ci[0]}~${est.ci[1]}%` : ""} />
        <Kpi value={`${Math.round((cp.none / cp.total) * 100)}%`} label="자동으로 예산·보조금24에 이어지지 않는 정책" note={`${cp.none.toLocaleString("ko-KR")}건 — 공통 번호가 없어 이름으로도 짝을 못 찾은 것`} />
        <Kpi value={`${ageOrder.filter((k) => L.ageAll[k]).length}가지`} label="‘청년’ 나이 상한" note="29·34·39·45·49세, 제한 없음 …" />
      </section>

      {/* coverage */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">온통청년 정책은 어디와 이어지나</h2>
        <p className="mt-2 max-w-[680px] text-[14px] leading-[1.8] text-ink-2">
          정책 {cp.total.toLocaleString("ko-KR")}건 가운데 보조금24 서비스와도, 예산서 세부사업과도 자동으로 이어지지 않는 것이{" "}
          <b className="font-semibold text-ink">{cp.none.toLocaleString("ko-KR")}건</b>입니다. 실제로 서비스·예산이 없다는 뜻이 아니라,
          세 장부에 공통 번호가 없어 이름과 지역으로만 짝을 찾을 수 있고 그 방법으로는 찾지 못했다는 뜻입니다. 등록할 때 보조금24
          서비스ID와 예산 코드를 함께 받으면 이 막대는 한 번에 채워집니다.
        </p>
        <div className="mt-6 rounded-[20px] border border-hair bg-card p-6">
          <StackedBars
            series={coverSeries}
            rows={[{ key: "all", label: "온통청년 정책", sub: `${cp.total.toLocaleString("ko-KR")}건`, values: cp }]}
            format="count"
          />
        </div>

        <h3 className="mt-10 text-[15px] font-bold tracking-[-0.02em]">거꾸로, 예산서의 청년 세부사업은 온통청년에 있나</h3>
        <p className="mt-1.5 max-w-[680px] text-[12.5px] leading-[1.7] text-ink-3">
          지방 청년 세부사업을 성격별로 나눴습니다. 표본 검토로 추정하면 청년이 직접 신청하는 ‘대상자 지원형’은{" "}
          <b className="font-semibold text-ink-2">약 {kindEst?.["대상자 지원"]?.share ?? "—"}%</b>(95% 구간 {kindEst?.["대상자 지원"]?.ci.join("~")}%), 센터 운영·시설 같은 ‘기반·운영형’은
          약 {kindEst?.["기반·운영"]?.share ?? "—"}%가 온통청년에 없습니다. 기반·운영형은 등록 대상인지부터 정해야 하므로 인벤토리의 첫 목표는 대상자 지원형입니다.
          막대는 건별 자동 판정입니다(‘없음’ 판정의 약 {local.accuracy?.absence}%가 맞음).
        </p>
        <div className="mt-4 rounded-[20px] border border-hair bg-card p-6">
          <StackedBars
            series={[
              { key: "present", label: "온통청년에 있음", color: C1 },
              { key: "absent", label: "온통청년에 없음", color: C2 },
            ]}
            rows={Object.entries(cf["지방"]).map(([k, v]) => ({
              key: k,
              label: k,
              sub: `${eok(v.bdg)} 원`,
              values: { present: v.n - v.absent, absent: v.absent },
            }))}
            mode="absolute"
            format="count"
          />
        </div>

        {g24 && (
          <>
            <h3 className="mt-10 text-[15px] font-bold tracking-[-0.02em]">보조금24 쪽에서 보면</h3>
            <p className="mt-1.5 max-w-[680px] text-[12.5px] leading-[1.7] text-ink-3">
              보조금24에서 청년 관련으로 잡히는 서비스 가운데 온통청년과 자동으로 이어지지 않는 {g24.population.toLocaleString("ko-KR")}건을 표본{" "}
              {g24.sample}건으로 하나씩 찾아봤습니다(AI 검색·판정). 약 3분의 1은 청년이 주 대상이 아닌 일반 서비스(전세사기 피해 지원·공공근로 등)였고, 청년 대상
              서비스 중에서는 약 {Math.round(g24.absentAmongYouth)}%가 온통청년에 실제로 없었습니다 —{" "}
              <b className="font-semibold text-ink-2">약 {g24.absentYouthN.toLocaleString("ko-KR")}건</b>(95% 구간 {g24.absentYouthNCi[0]}~{g24.absentYouthNCi[1]}건).
              표본 {g24.sample}건 중 {g24.missedByMatcher}건은 온통청년에 있는데 자동 대조가 놓친 것으로, 공통 번호 없이는 자동 연결에도 한계가 있습니다.
            </p>
          </>
        )}
      </section>

      {/* map */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">시·군·구 지도</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          같은 청년인데 사는 곳에 따라 닿는 예산과 정책이 다릅니다. 지표를 바꿔 보세요 — 1인당 예산이 많은 곳과
          온통청년에 잘 올라와 있는 곳이 같지 않습니다. 광역 본청 예산은 시·군·구에 나누지 않았으므로 아래 광역 막대에서 따로 봅니다.
        </p>
        <div className="mt-6">
          <SigunguMap shapes={shapes} units={L.units} width={MAP_W} height={MAP_H} outlines={outlines} />
        </div>
        {L.unmapped.length > 0 && (
          <p className="mt-3 text-[11.5px] text-ink-3">
            2026년 신설된 {L.unmapped.join("·")}은 2020 기준 경계에 없어 지도에서 비어 있습니다(수치는 표에 포함).
          </p>
        )}
      </section>

      {/* registration depends on the 광역, not on money */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">온통청년 등록 여부는 광역에 따라 크게 갈립니다</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          청년 세부사업이 5건 이상인 시·군·구 {eligible.length}곳의 ‘온통청년에 없는 비율’은 어느 광역에 속하느냐가 차이의{" "}
          <b className="font-semibold text-ink">약 {Math.round(eta2 * 100)}%</b>를 설명합니다 — {stripRows[0].label}은 중앙값{" "}
          {Math.round(stripRows[0].median * 100)}%, {stripRows[stripRows.length - 1].label}은{" "}
          {Math.round(stripRows[stripRows.length - 1].median * 100)}%입니다. 청년 1인당 예산과의 순위상관은{" "}
          <b className="font-semibold text-ink">{rho.toFixed(2)}</b>로{" "}
          {Math.abs(rho) < 0.1 ? "사실상 관계가 없습니다" : Math.abs(rho) < 0.3 ? "약합니다" : "뚜렷합니다"}. 예산 규모보다 시·군·구 사업을
          온통청년에 올리는 방식(광역이 모아 등록하는지, 시·군·구가 직접 하는지)이 결과를 좌우한다는 뜻이고, 그래서 등록 책임을 정하는
          것이 인벤토리의 첫 과제입니다. 시·군·구별 값은 자동 판정이라 개별 점은 흔들릴 수 있습니다.
        </p>
        <div className="mt-6 rounded-[20px] border border-hair bg-card p-6">
          <StripChart rows={stripRows} color={C2} />
        </div>
      </section>

      {/* 광역 per youth + funding mix */}
      <section className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">광역별 청년 1인당 예산</h2>
          <p className="mt-2 text-[13px] leading-[1.7] text-ink-2">본청과 시·군·구 청년 세부사업을 합쳐 20~39세 인구로 나눴습니다.</p>
          <ol className="mt-5 space-y-1.5">
            {sidoRows.map((s) => (
              <li key={s.sido} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-[4.5rem] shrink-0 font-semibold">{s.sido}</span>
                <span className="relative h-5 flex-1">
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-[4px]"
                    style={{ width: `${((s.budgetPerYouth ?? 0) / perYouthMax) * 100}%`, background: C1 }}
                    title={`${s.sido} · ${man(s.budgetPerYouth ?? 0)} · 청년 ${s.youthPop.toLocaleString("ko-KR")}명`}
                  />
                </span>
                <span className="tnum w-[5.5rem] shrink-0 text-right font-semibold">{man(s.budgetPerYouth ?? 0)}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">누구 돈인가 — 재원 구성</h2>
          <p className="mt-2 text-[13px] leading-[1.7] text-ink-2">
            지자체 청년 세부사업 예산현액을 국비·시도비·시군구비로 갈랐습니다. 국비 비중이 높을수록 중앙 사업을 지자체가 집행하는 몫이 큽니다.
          </p>
          <div className="mt-5">
            <StackedBars
              series={fundSeries}
              rows={sidoRows.map((s) => ({ key: s.sido, label: s.sido, values: s.fund }))}
              format="eok"
              labelWidth="4.5rem"
              minLabelShare={0.14}
            />
          </div>
        </div>
      </section>

      {/* age */}
      <section className="mt-16">
        <h2 className="text-[20px] font-bold tracking-[-0.025em]">청년은 몇 살까지인가</h2>
        <p className="mt-2 max-w-[680px] text-[13.5px] leading-[1.75] text-ink-2">
          온통청년 정책의 연령 상한입니다. 같은 ‘청년’인데 34세에서 끝나는 정책과 49세까지 받는 정책이 나란히 있습니다.
          인벤토리에서는 연령 조건을 보조금24 표준코드로 적어 두면, 사는 곳과 나이만으로 받을 수 있는 정책을 바로 걸러 낼 수 있습니다.
          지도의 ‘청년 나이 상한’ 지표로 지역별 차이도 볼 수 있습니다.
        </p>
        <ol className="mt-5 max-w-[640px] space-y-1.5">
          {ageOrder
            .filter((k) => L.ageAll[k])
            .map((k) => (
              <li key={k} className="flex items-center gap-3 text-[12.5px]">
                <span className="w-[5.5rem] shrink-0 font-semibold">{/^\d+$/.test(k) ? `${k}세까지` : k}</span>
                <span className="relative h-5 flex-1">
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-[4px]"
                    style={{ width: `${(L.ageAll[k] / ageMax) * 100}%`, background: k === "39" ? C1 : GRAY }}
                  />
                </span>
                <span className="tnum w-[4.5rem] shrink-0 text-right font-semibold">{L.ageAll[k].toLocaleString("ko-KR")}건</span>
              </li>
            ))}
        </ol>
      </section>

      <p className="mt-16 border-t border-hair pt-6 text-[12px] leading-[1.8] text-ink-3">
        출처 · 온통청년 공개 정책검색({L.asof.onthong}) · 보조금24(공공데이터포털) · 지방재정365 세부사업별 세출현황({ym(L.asof.local)}) ·
        열린재정 세부사업 일별 집행현황 · KOSIS 행정구역(읍면동)별/5세별 주민등록인구({ym(L.asof.population)}) · SGIS 2020 시군구 경계.
        청년 인구는 20~39세로 셌습니다(정책의 청년 정의는 대개 19~39세).
      </p>
    </div>
  );
}

function Node({ name, value, note }: { name: string; value: string; note: string }) {
  return (
    <div className="rounded-[16px] border border-hair bg-card p-5">
      <p className="text-[12px] font-semibold text-ink-3">{name}</p>
      <p className="tnum mt-1.5 text-[20px] leading-tight font-bold tracking-[-0.02em]">{value}</p>
      <p className="mt-1 text-[12px] text-ink-3">{note}</p>
    </div>
  );
}

function Kpi({ value, label, note }: { value: string; label: string; note: string }) {
  return (
    <div className="rounded-[16px] border border-hair bg-card p-5">
      <p className="tnum text-[30px] leading-none font-bold tracking-[-0.03em]">{value}</p>
      <p className="mt-2 text-[13px] font-semibold">{label}</p>
      <p className="mt-1 text-[11.5px] leading-[1.5] text-ink-3">{note}</p>
    </div>
  );
}
