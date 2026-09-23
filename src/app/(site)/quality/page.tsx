import type { Metadata } from "next";
import Link from "next/link";
import { quality } from "@/lib/data";
import StackedBars, { type Series } from "@/components/link/StackedBars";

export const metadata: Metadata = {
  title: "점검",
  description: "온통청년 등록 자료를 그대로 세어, 인벤토리에 어떤 등록 기준이 필요한지 봅니다 — 등록 시점, 중복 등록, 비어 있거나 서로 어긋난 항목.",
};

// reference categorical slots (validated adjacent pairs on the light surface)
const C1 = "#2a78d6";
const C2 = "#eb6834";
const C3 = "#1baf7a";
const GRAY = "#b9b9b3";

const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;

/** each finding → the registration rule that removes it */
const FIXES: { issue: string; rule: string }[] = [
  { issue: "마감 뒤에야 등록", rule: "사업 확정(또는 공고) 후 ○일 안 등록, 늦으면 현황판에 표시" },
  { issue: "같은 사업을 해마다·차수마다 새로 등록", rule: "정책 ID는 사업에 한 번만 — 연도·차수는 그 아래 ‘회차’로" },
  { issue: "‘마감’인데 신청기간 없음", rule: "상태는 신청기간에서 자동 계산(수기 입력 금지)" },
  { issue: "신청 경로·지원규모 비어 있음", rule: "보조금24 서비스ID 또는 신청 URL 중 하나 필수, 지원규모 필수" },
  { issue: "연령 표시와 값이 어긋남", rule: "자격조건은 보조금24 표준코드(연령·소득·가구)로만" },
  { issue: "중앙/지자체 구분·대상 지역 오기", rule: "기관코드에서 자동 판정, 대상 지역은 행정구역 코드로" },
  { issue: "1·2차 기본계획 과제 혼재, 분류 2종", rule: "현행 계획 과제번호·단일 분류로 일괄 재매핑 후 필수" },
  { issue: "예산·실적·성과 항목 없음", rule: "재정사업 코드(지방재정365·열린재정) 연결 → 예산·집행 자동 채움" },
];

export default function QualityPage() {
  const q = quality;
  const t = q.timing;
  const t26 = q.timing2026;
  const timingSeries: Series[] = [
    { key: "before", label: "신청 시작 전 등록", color: C1 },
    { key: "during", label: "신청 중 등록", color: C3, onColor: "#0b0b0b" },
    { key: "after", label: "마감 뒤 등록", color: C2 },
  ];
  const fieldsMax = Math.max(...q.fields.map((f) => f.n));

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[820px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
        온통청년 자료를 그대로 세어 보면.
      </h1>
      <p className="mt-5 max-w-[700px] text-[15px] leading-[1.85] text-ink-2">
        다른 장부와 잇지 않고, 온통청년에 등록된 {q.total.toLocaleString("ko-KR")}건만 셌습니다({q.asof} 기준). 추정이나 자동 판정이 없는 숫자라,
        인벤토리가 어떤 등록 기준부터 갖춰야 하는지를 가장 직접 보여 줍니다. 등록 담당자 개인의 문제가 아니라 기준이 없어서 생기는 일입니다.
      </p>

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi value={pct(t26.late, t26.withDates)} label="마감 뒤에야 등록된 정책" note={`2026년 마감 ${t26.withDates}건 중 ${t26.late}건 · 중앙값 ${t26.medianDaysLate}일 늦음`} />
        <Kpi value={`${q.dup.extra.toLocaleString("ko-KR")}건`} label="같은 사업의 중복 등록" note={`${q.dup.clusters}개 사업이 ${q.dup.entries}건으로 — 전체의 ${pct(q.dup.extra, q.total)}`} />
        <Kpi value={`${q.status.closedNoDates.toLocaleString("ko-KR")}건`} label="‘마감’인데 신청기간이 없음" note="언제 열렸다 닫혔는지 알 수 없음" />
        <Kpi value={pct(q.fields[0].n, q.total)} label="신청 경로(URL)가 없음" note={`${q.fields[0].n.toLocaleString("ko-KR")}건 — 어디서 신청하는지 모름`} />
      </section>

      {/* timing */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">언제 올라오나 — 넷 중 하나는 마감 뒤</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          신청기간이 적힌 정책을 등록일과 견줬습니다. 온통청년 개편 때 옮겨 온 자료가 섞이지 않도록 <b className="font-semibold text-ink">2026년에 마감된 {t26.withDates}건</b>만
          따로 보면 <b className="font-semibold text-ink">{t26.late}건({pct(t26.late, t26.withDates)})</b>이 신청이 끝난 뒤에 등록됐습니다. 청년이 온통청년에서
          이 정책을 처음 봤을 때는 이미 신청할 수 없었다는 뜻입니다. 기간 전체({t.withDates.toLocaleString("ko-KR")}건)로 넓혀도 {pct(t["마감 뒤 등록"], t.withDates)}입니다.
        </p>
        <div className="mt-6 rounded-[20px] border border-hair bg-card p-6">
          <StackedBars
            series={timingSeries}
            rows={[
              { key: "all", label: "신청기간 있는 정책", sub: `${t.withDates.toLocaleString("ko-KR")}건`, values: { before: t["신청 시작 전 등록"], during: t["신청 시작 뒤 등록"], after: t["마감 뒤 등록"] } },
            ]}
            format="count"
          />
          <p className="mt-4 text-[12px] text-ink-3">
            나머지 {t["기간 없음"].toLocaleString("ko-KR")}건은 신청기간이 적혀 있지 않아(상시 포함) 비교할 수 없습니다.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[20px] border border-hair bg-card p-6">
            <h3 className="text-[14px] font-bold">가장 늦게 올라온 정책 <span className="text-[11.5px] font-normal text-ink-3">2026년 마감분</span></h3>
            <ol className="mt-3 border-t border-hair">
              {q.lateExamples.slice(0, 8).map((x) => (
                <li key={x.n + x.reg} className="flex items-baseline justify-between gap-3 border-b border-hair py-2 text-[12.5px]">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{x.n}</span>
                    <span className="block text-[11.5px] text-ink-3">
                      {x.inst} · 마감 {x.end} → 등록 {x.reg}
                    </span>
                  </span>
                  <span className="tnum shrink-0 font-bold">{x.days}일</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[20px] border border-hair bg-card p-6">
            <h3 className="text-[14px] font-bold">등록 주체별 ‘마감 뒤 등록’ 비율</h3>
            <p className="mt-1 text-[11.5px] text-ink-3">2026년에 마감된 정책 기준 · 20건 넘는 곳</p>
            <ol className="mt-3 space-y-1.5">
              {q.lateBySido
                .filter((r) => r.withDates >= 20)
                .map((r) => (
                  <li key={r.sido} className="flex items-center gap-3 text-[12.5px]">
                    <span className="w-[4.5rem] shrink-0 font-semibold">{r.sido}</span>
                    <span className="relative h-4 flex-1 bg-wash">
                      <span className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${(r.late / r.withDates) * 100}%`, background: C2 }} />
                    </span>
                    <span className="tnum w-[6.5rem] shrink-0 text-right">
                      <b>{pct(r.late, r.withDates)}</b> <span className="text-ink-3">{r.late}/{r.withDates}</span>
                    </span>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      </section>

      {/* duplicates */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">한 사업, 여러 건 — 정책에 고유번호가 없다</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          같은 기관이 같은 사업을 연도·차수·구별로 새 글처럼 올리면서 {q.dup.clusters}개 사업이 {q.dup.entries}건으로 늘어나 있습니다. 옛 글은 ‘마감’으로 남고 새
          글이 따로 생겨, 사업 하나의 예산·실적을 해마다 이어 볼 방법이 없습니다. 여러 기관이 같은 국가사업을 각자 올리는 경우도 많습니다.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[20px] border border-hair bg-card p-6">
            <h3 className="text-[14px] font-bold">가장 많이 나뉘어 등록된 사업</h3>
            <ol className="mt-3 border-t border-hair">
              {q.dupTop.slice(0, 8).map((d) => (
                <li key={d.n + d.who} className="border-b border-hair py-2 text-[12.5px]">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{d.names[0]}</span>
                    <span className="tnum shrink-0 font-bold">{d.count}건</span>
                  </span>
                  <span className="block text-[11.5px] text-ink-3">
                    {d.who} · {Object.entries(d.statuses).map(([k, v]) => `${k} ${v}`).join(" · ")}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[20px] border border-hair bg-card p-6">
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
            <p className="mt-2 text-[11.5px] text-ink-3">이름에서 연도·차수·‘모집’ 같은 말을 걷어낸 뒤 같은 이름끼리 묶었습니다(무작위 15묶음 검토 결과 모두 같은 사업).</p>
          </div>
        </div>
      </section>

      {/* fields */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">비어 있거나 서로 어긋난 항목</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">전체 {q.total.toLocaleString("ko-KR")}건 가운데 해당하는 건수입니다.</p>
        <ol className="mt-5 max-w-[880px] space-y-2">
          {q.fields.map((f) => (
            <li key={f.k} className="flex items-center gap-3 text-[13px]">
              <span className="w-[15rem] shrink-0">
                <span className="block font-semibold">{f.k}</span>
                {f.note && <span className="block text-[11px] text-ink-3">{f.note}</span>}
              </span>
              <span className="relative h-5 flex-1 bg-wash">
                <span className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${(f.n / fieldsMax) * 100}%`, background: f.k.startsWith("예산") ? GRAY : C1 }} />
              </span>
              <span className="tnum w-[7.5rem] shrink-0 text-right">
                <b>{f.n.toLocaleString("ko-KR")}</b> <span className="text-ink-3">{pct(f.n, q.total)}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* what fixes it */}
      <section className="mt-16">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">무엇을 정하면 사라지나</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          대부분은 새 시스템 없이 등록 기준만으로 없어집니다. 전체 구상은{" "}
          <Link href="/proposal" className="font-semibold underline underline-offset-2 hover:text-ink">
            제안
          </Link>
          에 있습니다.
        </p>
        <div className="mt-5 overflow-x-auto rounded-[20px] border border-hair bg-card">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-hair text-left text-[12px] text-ink-3">
                <th className="px-5 py-3 font-semibold">지금 보이는 문제</th>
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
        출처 · 온통청년 공개 정책검색({q.asof} 수집, {q.total.toLocaleString("ko-KR")}건). 등록일은 최초등록일시, 신청기간은 신청 시작·종료일 항목을 그대로 썼습니다.
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
