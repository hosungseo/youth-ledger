import type { Metadata } from "next";
import Link from "next/link";
import { quality } from "@/lib/data";
import StackedBars, { type Series } from "@/components/link/StackedBars";

export const metadata: Metadata = {
  title: "점검",
  description: "온통청년 등록 자료를 그대로 세어, 인벤토리에 어떤 등록 기준이 필요한지 봅니다 — 등록 시기, 회차·지역 분산, 구조화되지 않은 항목.",
};

// reference categorical slots (validated adjacent pairs on the light surface)
const C1 = "#2a78d6";
const C2 = "#eb6834";
const C3 = "#1baf7a";
const C4 = "#eda100";
const GRAY = "#b9b9b3";

const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;
const n = (v: number) => v.toLocaleString("ko-KR");

/** each finding → the registration rule that removes it */
const FIXES: { issue: string; rule: string }[] = [
  { issue: "연초에 공고되는 사업이 마감 뒤 등록", rule: "지난해 정책의 새 회차는 과제 체계가 확정되기 전에도 먼저 등록(과제 매핑은 나중에 보완)" },
  { issue: "같은 사업을 해마다·차수마다·지역마다 새 건으로 등록", rule: "정책 ID는 사업에 한 번만 — 연도·차수·대상 지역은 그 아래 ‘회차’로" },
  { issue: "신청 바로가기가 글로만 적힘", rule: "신청 URL 또는 보조금24 서비스ID 중 하나를 구조화 항목으로" },
  { issue: "지원 인원 항목의 뜻이 모호", rule: "‘제한 없음’과 ‘인원 미정’을 구분하는 입력 규칙" },
  { issue: "연령 표시와 값이 어긋남", rule: "자격조건은 보조금24 표준코드(연령·소득·가구)로 함께 기록" },
  { issue: "중앙/지자체 구분·대상 지역 오기", rule: "기관코드에서 자동 판정, 대상 지역은 행정구역 코드로" },
  { issue: "예산·실적이 정책과 따로 있음", rule: "시행계획 제출 때 받는 세부사업 코드로 연결 → 예산·집행 자동 채움" },
  { issue: "지난해 등록분의 과제·분류 이력", rule: "1·2차 기본계획 과제 대응표로 연도 간 비교" },
];

export default function QualityPage() {
  const q = quality;
  const s = q.timingSeason;
  const d = q.dup;
  const lg = q.legacy;
  const seasonSeries: Series[] = [
    { key: "ontime", label: "마감 전 등록", color: C1 },
    { key: "after", label: "마감 뒤 등록", color: C2 },
  ];
  const dupSeries: Series[] = [
    { key: "year", label: "해마다 새로 등록", color: C1 },
    { key: "area", label: "지역별로 나눠 등록", color: C2 },
    { key: "round", label: "같은 해 차수별 등록", color: C3, onColor: "#0b0b0b" },
    { key: "same", label: "같은 내용 반복", color: C4, onColor: "#0b0b0b" },
  ];
  const fieldsNow: { k: string; v: number; of: number; note: string }[] = [
    { k: "신청 바로가기(URL) 항목이 빔", v: q.apply.noUrl, of: q.total, note: `신청방법·공고문은 글로 적힌 경우가 많아 자동 연결이 안 됨. 신청 정보가 전혀 없는 건 ${n(q.apply.noneAtAll)}건(지금 신청 가능한 정책 중 ${q.apply.openNoneAtAll}건)` },
    { k: "지원 인원 ‘제한 있음’인데 인원 공란", v: q.scale.flagYBlank, of: q.scale.flagY, note: `‘제한 없음’ 표시 ${n(q.scale.flagNBlank)}건의 공란은 정상일 수 있어 제외` },
    ...q.fields
      .filter((f) => ["연령제한 표시와 연령값 불일치", "중앙/지자체 구분과 기관코드 불일치", "지자체 정책인데 대상 지역 ‘전국’"].includes(f.k))
      .map((f) => ({ k: f.k, v: f.n, of: q.total, note: f.note ?? "" })),
  ];
  const legacy = [
    { k: "1차 기본계획 과제로 남은 정책", v: lg.plan1, note: `모두 2025년까지 등록 · 지금 신청 가능한 것은 ${lg.plan1Open}건` },
    { k: "구 분류체계로 남은 정책", v: lg.oldCat, note: `모두 2025년 등록·마감 건` },
    { k: "‘마감’인데 신청기간이 없는 정책", v: lg.closedNoDates, note: `${n(lg.closedNoDatesBefore2026)}건이 2025년 이전 등록 · ${n(lg.closedNoDatesWithBizPeriod)}건은 사업기간 기재` },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[820px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
        온통청년 자료를 그대로 세어 보면.
      </h1>
      <p className="mt-5 max-w-[700px] text-[15px] leading-[1.85] text-ink-2">
        다른 장부와 잇지 않고, 온통청년에 게시된 {n(q.total)}건만 셌습니다({q.asof} 기준). 추정이나 자동 판정이 없는 숫자입니다. 대부분은 등록 담당자의
        잘못이 아니라 회차·지역·신청처를 담을 항목과 등록 시기 기준이 없어서 생기는 일이고, 그래서 인벤토리가 무엇부터 정해야 하는지를 보여 줍니다.
      </p>

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi value={pct(s.janApr.late, s.janApr.n)} label="1~4월 마감 정책의 마감 뒤 등록" note={`2026년 1~4월 마감 ${s.janApr.n}건 중 ${s.janApr.late}건 · 5월 이후 마감분은 ${pct(s.mayOn.late, s.mayOn.n)}`} />
        <Kpi value={`${n(d.clusters)}개`} label="여러 건으로 나뉘어 등록된 사업" note={`${n(d.entries)}건으로 분산 · 지금 동시에 신청 가능한 상태로 겹치는 것은 ${d.openDup}건`} />
        <Kpi value={pct(q.apply.noUrl, q.total)} label="신청 바로가기(URL) 항목이 빔" note={`신청방법은 글로만 적혀 자동 연결 불가 · 신청 정보가 전혀 없는 건 ${n(q.apply.noneAtAll)}건`} />
        <Kpi value={pct(q.taskNo.filled, q.total)} label="기본계획 과제번호 기재" note="과제번호는 모두 있음 — 보조금24 서비스ID·재정사업 코드는 없음" />
      </section>

      {/* timing */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">언제 올라오나 — 연초에 공고되는 사업이 늦다</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          2026년에 마감된 정책 중 1~4월 마감분은 <b className="font-semibold text-ink">{pct(s.janApr.late, s.janApr.n)}</b>가 마감 뒤에 등록됐지만, 5월 이후 마감분은{" "}
          <b className="font-semibold text-ink">{pct(s.mayOn.late, s.mayOn.n)}</b>입니다. 2026년 1~2월 신규 등록이 {s.regsByMonth2026[0] + s.regsByMonth2026[1]}건(전년 같은 기간{" "}
          {s.regsByMonth2025[0] + s.regsByMonth2025[1]}건)에 그치고 3~4월에 몰린 것으로 보아, 개인의 지연보다 연도가 바뀌며 과제 체계가 확정되기 전까지 등록이 멈추는
          구조의 문제로 보입니다(운영기관 확인 필요). 지난해 정책의 새 회차를 먼저 등록할 수 있으면 풀립니다.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="min-w-0 rounded-[20px] border border-hair bg-card p-6">
            <h3 className="text-[14px] font-bold">마감 시기별 등록 시점 <span className="text-[11.5px] font-normal text-ink-3">2026년 마감분</span></h3>
            <div className="mt-4">
              <StackedBars
                series={seasonSeries}
                rows={[
                  { key: "janApr", label: "1~4월 마감", sub: `${s.janApr.n}건`, values: { ontime: s.janApr.n - s.janApr.late, after: s.janApr.late } },
                  { key: "mayOn", label: "5월 이후 마감", sub: `${s.mayOn.n}건`, values: { ontime: s.mayOn.n - s.mayOn.late, after: s.mayOn.late } },
                ]}
                format="count"
              />
            </div>
          </div>
          <div className="min-w-0 rounded-[20px] border border-hair bg-card p-6">
            <h3 className="text-[14px] font-bold">월별 신규 등록 <span className="text-[11.5px] font-normal text-ink-3">2026년은 {q.asof}까지</span></h3>
            <MonthBars a={s.regsByMonth2025} b={s.regsByMonth2026.slice(0, 9)} />
          </div>
        </div>
        <p className="mt-4 max-w-[700px] text-[12.5px] leading-[1.7] text-ink-3">
          {Number(s.catchUp.from.slice(5, 7))}. {Number(s.catchUp.from.slice(8, 10))}. 이후 중앙부처 신규 등록이 {s.catchUp.central}건 이어져 누락 보완이 진행 중인 것으로 보입니다(그중 이미 마감된 정책 {s.catchUp.lateAmong}건).
        </p>
      </section>

      {/* one program, many entries */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">한 사업, 여러 건 — 회차·지역을 담을 항목이 없다</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          같은 기관의 같은 사업이 {n(d.clusters)}개, {n(d.entries)}건으로 나뉘어 있습니다. 대부분은 잘못 올린 것이 아니라 해마다·차수마다·지역마다 새 건으로
          올릴 수밖에 없는 구조 때문이고, 지금 동시에 신청 가능한 상태로 겹치는 것은 <b className="font-semibold text-ink">{d.openDup}건</b>입니다. 다만 이렇게는 사업 하나의
          예산·실적을 해마다 이어 볼 수 없습니다.
        </p>
        <div className="mt-6 rounded-[20px] border border-hair bg-card p-6">
          <StackedBars
            series={dupSeries}
            rows={[{ key: "extra", label: "추가 등록", sub: `${n(d.extra)}건`, values: { year: d.byYear, area: d.byArea, round: d.byRound, same: d.same } }]}
            format="count"
          />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="min-w-0 rounded-[20px] border border-hair bg-card p-6">
            <h3 className="text-[14px] font-bold">가장 많이 나뉘어 등록된 사업</h3>
            <ol className="mt-3 border-t border-hair">
              {q.dupTop.slice(0, 8).map((x) => (
                <li key={x.n + x.who} className="border-b border-hair py-2 text-[12.5px]">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{x.names[0].replace(/^\s*[(\[（][^)\]）]*[)\]）]\s*/, "")}</span>
                    <span className="tnum shrink-0 font-bold">{x.count}건</span>
                  </span>
                  <span className="block text-[11.5px] text-ink-3">
                    {x.who} · 연도 {x.years}개 · 대상 지역 {x.areas}가지 · {Object.entries(x.statuses).map(([k, v]) => `${k} ${v}`).join(" · ")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="min-w-0 rounded-[20px] border border-hair bg-card p-6">
            <h3 className="text-[14px] font-bold">여러 기관이 따로 올린 같은 사업</h3>
            <ol className="mt-3 border-t border-hair">
              {q.crossAgency.slice(0, 8).map((c) => (
                <li key={c.k} className="border-b border-hair py-2 text-[12.5px]">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{c.k}</span>
                    <span className="tnum shrink-0 font-bold">{c.agencies}곳</span>
                  </span>
                  <span className="block truncate text-[11.5px] text-ink-3">{c.sample.join(" · ")}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-[11.5px] leading-[1.6] text-ink-3">
              국고보조 사업을 집행 기관마다 올린 경우가 많아 결함이라기보다, 정책 ID의 상·하위 연결로 묶을 대상입니다.
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] leading-[1.6] text-ink-3">
          묶는 법: 같은 등록 기관에서 이름의 연도·차수·‘모집’ 같은 말과 괄호 속 지역명을 걷어낸 뒤 같은 이름끼리. 괄호 속 유형·기관명이 다르면(매입임대·전세임대 등) 다른 사업으로 봤습니다.
        </p>
      </section>

      {/* fields */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">구조화되지 않았거나 서로 어긋난 항목</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          예산·수혜실적·성과는 온통청년에 항목이 없고 시행계획으로 따로 제출됩니다 — 둘을 잇는 번호가 없는 것이 문제입니다. 그 밖에 자동 연결을 막는 항목입니다.
        </p>
        <ol className="mt-5 max-w-[920px] space-y-2.5">
          {fieldsNow.map((f) => (
            <li key={f.k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-[13px] sm:flex">
              <span className="col-span-2 min-w-0 sm:w-[17rem] sm:shrink-0">
                <span className="block font-semibold">{f.k}</span>
                <span className="block text-[11px] leading-[1.5] text-ink-3">{f.note}</span>
              </span>
              <span className="relative h-5 flex-1 bg-wash">
                <span className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${(f.v / f.of) * 100}%`, background: C1 }} />
              </span>
              <span className="tnum text-right sm:w-[8.5rem] sm:shrink-0">
                <b>{n(f.v)}</b> <span className="text-ink-3">/ {n(f.of)} · {pct(f.v, f.of)}</span>
              </span>
            </li>
          ))}
        </ol>

        <h3 className="mt-10 text-[15px] font-bold tracking-[-0.02em]">지난해 등록분의 이력</h3>
        <p className="mt-1.5 max-w-[700px] text-[12.5px] leading-[1.7] text-ink-3">
          계획 차수가 바뀌고 새 플랫폼으로 옮기면서 남은 과거 기록이라 결함으로 세지 않습니다. 연도 간 비교에는 1·2차 과제 대응표가 필요합니다.
        </p>
        <ol className="mt-4 max-w-[920px] space-y-2">
          {legacy.map((f) => (
            <li key={f.k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-[13px] sm:flex">
              <span className="col-span-2 min-w-0 sm:w-[17rem] sm:shrink-0">
                <span className="block font-semibold">{f.k}</span>
                <span className="block text-[11px] leading-[1.5] text-ink-3">{f.note}</span>
              </span>
              <span className="relative h-5 flex-1 bg-wash">
                <span className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${(f.v / q.total) * 100}%`, background: GRAY }} />
              </span>
              <span className="tnum text-right sm:w-[8.5rem] sm:shrink-0">
                <b>{n(f.v)}</b> <span className="text-ink-3">{pct(f.v, q.total)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* what fixes it */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">무엇을 정하면 사라지나</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          대부분은 새 시스템 없이 등록 기준과 기존 절차(시행계획 제출)를 잇는 것만으로 없어집니다. 전체 구상은{" "}
          <Link href="/proposal" className="font-semibold underline underline-offset-2 hover:text-ink">
            제안
          </Link>
          에 있습니다.
        </p>
        <div className="mt-5 overflow-x-auto rounded-[20px] border border-hair bg-card">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-hair text-left text-[12px] text-ink-3">
                <th className="px-5 py-3 font-semibold">지금 보이는 현상</th>
                <th className="px-5 py-3 font-semibold">인벤토리 등록 기준</th>
              </tr>
            </thead>
            <tbody>
              {FIXES.map((f) => (
                <tr key={f.issue} className="border-b border-hair last:border-0">
                  <td className="px-5 py-3 font-semibold">{f.issue}</td>
                  <td className="px-5 py-3 text-ink-2">{f.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-14 border-t border-hair pt-6 text-[12px] leading-[1.8] text-ink-3">
        출처 · 온통청년 공개 정책검색({q.asof} 수집, 게시된 {n(q.total)}건 — 미게시 건은 포함되지 않음). 등록일은 최초등록일시, 신청기간은 신청 시작·종료일 항목을 그대로 썼습니다.
        등록 담당자 관련 항목은 수집 단계에서 지웠고 쓰지 않았습니다.
      </p>
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

/** Monthly new registrations, two years side by side; hover shows the count, a table follows for exact values. */
function MonthBars({ a, b }: { a: number[]; b: number[] }) {
  const max = Math.max(...a, ...b);
  const H = 120;
  return (
    <div className="mt-4">
      <div className="flex gap-4 text-[11.5px] text-ink-2">
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: C1 }} />2025년</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: C2 }} />2026년</span>
      </div>
      <div className="mt-3 flex items-end gap-1.5 border-b border-hair" style={{ height: H + 18 }}>
        {a.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-end justify-center gap-[2px]" style={{ height: H }}>
              <span title={`2025년 ${i + 1}월 ${v}건`} className="w-[42%] rounded-t-[4px]" style={{ height: Math.max(1, (v / max) * H), background: C1 }} />
              {i < b.length && (
                <span title={`2026년 ${i + 1}월 ${b[i]}건`} className="w-[42%] rounded-t-[4px]" style={{ height: Math.max(1, (b[i] / max) * H), background: C2 }} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 text-[10.5px] text-ink-3">
        {a.map((_, i) => (
          <span key={i} className="flex-1 text-center">{i + 1}월</span>
        ))}
      </div>
      <details className="mt-3 text-[11.5px] text-ink-3">
        <summary className="cursor-pointer">표로 보기</summary>
        <div className="mt-2 overflow-x-auto">
          <table className="tnum w-full min-w-[520px] text-right">
            <thead>
              <tr><th className="text-left font-semibold">연도</th>{a.map((_, i) => <th key={i} className="font-semibold">{i + 1}월</th>)}</tr>
            </thead>
            <tbody>
              <tr><td className="text-left">2025</td>{a.map((v, i) => <td key={i}>{v}</td>)}</tr>
              <tr><td className="text-left">2026</td>{a.map((_, i) => <td key={i}>{i < b.length ? b[i] : "—"}</td>)}</tr>
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
