import type { Metadata } from "next";
import Link from "next/link";
import { fiscal, link, meta, quality } from "@/lib/data";

export const metadata: Metadata = {
  title: "제안",
  description: "온통청년을 범정부 청년정책 인벤토리로 — 이미 있는 장부(보조금24·지방재정365·열린재정)를 정책 ID 하나로 잇는 구상과 단계별 추진안.",
};

const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;

export default function ProposalPage() {
  const q = quality;
  const est = fiscal.meta.absentEstimate;
  const cp = link.coveragePolicy;

  // measured today → target once the inventory rules apply
  const baseline: { k: string; now: string; to: string; how: string }[] = [
    { k: "예산서의 청년사업 중 온통청년에 있는 비율(지방)", now: est ? `약 ${Math.round(100 - est.absentShare)}%` : "—", to: "대상자 지원형 전부", how: "재정사업 코드로 누락 목록 자동 산출 → 등록기관 확인" },
    { k: "온통청년 정책 중 보조금24 서비스와 이어진 비율", now: `직접 링크 1% · 자동 매칭 ${pct(meta.withGov24 ?? 0, meta.total)}`, to: "현금·바우처형 전부", how: "등록 때 보조금24 서비스ID 필수" },
    { k: "정책에 예산·집행이 붙은 비율", now: `항목 없음 (자동 연결 ${pct(meta.withBudget ?? 0, meta.total)})`, to: "전 정책", how: "재정사업 코드 연결 → 지방재정365·열린재정에서 자동" },
    { k: "마감 뒤에야 등록된 정책(2026년 마감분)", now: pct(q.timing2026.late, q.timing2026.withDates), to: "0%", how: "사업 확정 후 등록 기한, 늦으면 현황판 표시" },
    { k: "같은 사업의 중복 등록", now: `${q.dup.extra}건`, to: "0건", how: "정책 ID는 한 번, 연도·차수는 회차로" },
    { k: "신청 경로(URL·서비스ID) 없는 정책", now: pct(q.fields[0].n, q.total), to: "0%", how: "둘 중 하나 필수" },
    { k: "공통 번호가 없어 자동으로 이어지지 않는 정책", now: pct(cp.none, cp.total), to: "0%", how: "위 두 코드만 받으면 자동" },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[860px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
        새 시스템이 아니라,
        <br />
        이미 있는 장부를 번호 하나로.
      </h1>
      <p className="mt-5 max-w-[720px] text-[15px] leading-[1.85] text-ink-2">
        청년정책 전담조직이 정책을 조정하려면 먼저 ‘무엇을, 누가, 누구에게, 얼마로’ 하는지 한 목록이 있어야 합니다. 그 목록의 재료는 이미 있습니다 —
        정책은 온통청년에, 자격과 신청은 보조금24에, 예산과 집행은 지방재정365·열린재정에. 비어 있는 것은 이것들을 잇는{" "}
        <b className="font-semibold text-ink">공통 번호와 등록 기준</b>입니다. 이 대장은 그 연결을 공개 자료만으로 먼저 해 본 것입니다.
      </p>

      {/* roles */}
      <section className="mt-12">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">역할 나누기</h2>
        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] lg:items-stretch">
          <Box tag="원천" title="등록기관" lines={["중앙부처 · 광역 · 시·군·구", "사업을 만들고 바꿀 때 한 번 등록", "정책 ID · 보조금24 서비스ID · 재정사업 코드"]} />
          <Arrow />
          <Box
            tag="기준 목록"
            title="온통청년 → 청년정책 인벤토리"
            lines={["범정부 청년정책의 단일 목록과 정책 ID", "예산·집행은 재정 장부에서, 자격은 보조금24에서 끌어와 표시", "중복·사각지대·기본계획 과제별 현황을 정기 산출"]}
            dark
          />
          <Arrow />
          <Box tag="쓰는 곳" title="청년 · 전담조직" lines={["청년: 내 조건으로 찾고 보조금24로 신청", "전담조직: 과제별 예산·중복·빈칸으로 조정", "지자체: 우리 지역 등록 상태 확인"]} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Box tag="연계" title="보조금24" lines={["자격 판정(행정정보·동의)과 신청", "연령·소득·가구 표준 조건코드의 원천"]} />
          <Box tag="연계" title="지방재정365 · 열린재정" lines={["세부사업 예산현액·집행액·재원", "일별 집행까지 — 인벤토리는 코드만 들고 있음"]} />
        </div>
      </section>

      {/* ID chain */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">번호 체계</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          정책 ID 하나에 나머지 번호가 매달립니다. 해마다 새로 올리던 공고는 같은 ID 아래 ‘회차’가 됩니다.
        </p>
        <div className="mt-5 flex flex-wrap items-stretch gap-2">
          {[
            ["정책 ID", "사업에 한 번 · 바뀌지 않음"],
            ["회차", "연도·차수·공고"],
            ["보조금24 서비스ID", "자격·신청"],
            ["재정사업 코드", "지방재정365 세부사업 · 열린재정 세부사업"],
            ["기본계획 과제번호", "현행 계획 기준"],
          ].map(([a, b], i) => (
            <div key={a} className="flex items-stretch gap-2">
              {i > 0 && <span className="self-center text-ink-3" aria-hidden>—</span>}
              <div className="rounded-[14px] border border-hair bg-card px-4 py-3">
                <p className="text-[13.5px] font-bold">{a}</p>
                <p className="mt-0.5 text-[11.5px] text-ink-3">{b}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* baseline → target */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">지금 잰 값과 목표</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          왼쪽은 이 대장이 공개 자료로 잰 현재 값입니다. 전담조직이 분기마다 같은 방법으로 재면 그대로 추진 지표가 됩니다.
        </p>
        <div className="mt-5 overflow-x-auto rounded-[20px] border border-hair bg-card">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-b border-hair text-left text-[12px] text-ink-3">
                <th className="px-5 py-3 font-semibold">지표</th>
                <th className="px-4 py-3 font-semibold">지금</th>
                <th className="px-4 py-3 font-semibold">목표</th>
                <th className="px-5 py-3 font-semibold">어떻게</th>
              </tr>
            </thead>
            <tbody>
              {baseline.map((b) => (
                <tr key={b.k} className="border-b border-hair last:border-0">
                  <td className="px-5 py-3 font-semibold">{b.k}</td>
                  <td className="tnum px-4 py-3 whitespace-nowrap">{b.now}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{b.to}</td>
                  <td className="px-5 py-3 text-ink-2">{b.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11.5px] text-ink-3">
          ‘온통청년에 있는 비율’은 표본 검토 추정, 나머지는 전수 집계 또는 자동 연결 결과입니다. 산정 방법은{" "}
          <Link href="/about" className="underline underline-offset-2 hover:text-ink">
            자료
          </Link>
          와{" "}
          <Link href="/quality" className="underline underline-offset-2 hover:text-ink">
            점검
          </Link>
          에 있습니다.
        </p>
      </section>

      {/* fields */}
      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">등록기관이 넣는 것</h2>
          <ul className="mt-4 space-y-1.5 text-[13.5px] text-ink-2">
            {["정책 ID(최초 1회) · 회차", "보조금24 서비스ID 또는 신청 URL", "재정사업 코드(세부사업)", "지원규모(계획 인원·건)", "신청기간 · 담당 부서", "기본계획 과제번호(현행)"].map((x) => (
              <li key={x} className="flex gap-2.5">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[20px] font-bold tracking-[-0.025em]">자동으로 채워지는 것</h2>
          <ul className="mt-4 space-y-1.5 text-[13.5px] text-ink-2">
            {[
              "예산현액·집행액·재원 — 재정사업 코드로 지방재정365·열린재정에서",
              "자격조건(연령·소득·가구) — 보조금24 서비스ID로",
              "신청 상태 — 신청기간에서 계산",
              "중앙/지자체 구분·대상 지역 — 기관코드에서",
              "청년 1인당 예산·지역 비교 — 주민등록인구와 결합",
            ].map((x) => (
              <li key={x} className="flex gap-2.5">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* steps */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">단계별 추진(안)</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["1단계 · 연결 복원", "이 대장의 자동 연결 결과(보조금24·재정사업)를 등록기관이 확인·확정. 연결률이 낮은 광역 한 곳에서 먼저 시범."],
            ["2단계 · 등록 기준", "정책 ID·회차, 서비스ID·재정사업 코드 필수화, 등록 기한, 상태 자동 계산. 기본계획 과제 일괄 재매핑."],
            ["3단계 · 시스템 연계", "보조금24·지방재정365·열린재정 코드 조회를 온통청년 등록 화면에 연결. 공개 API로 인벤토리 제공."],
            ["4단계 · 조정 지표", "중복·빈칸·마감 뒤 등록·청년 1인당 예산을 분기마다 공표해 전담조직의 조정 자료로."],
          ].map(([a, b]) => (
            <li key={a} className="rounded-[16px] border border-hair bg-card p-5">
              <p className="text-[14px] font-bold">{a}</p>
              <p className="mt-2 text-[12.5px] leading-[1.7] text-ink-2">{b}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 rounded-[20px] border border-dashed border-hair bg-paper p-6">
        <h2 className="text-[13px] font-semibold text-ink-3">함께 해야 할 곳</h2>
        <ul className="mt-3 space-y-1.5 text-[13.5px] text-ink-2">
          <li>· 국무조정실 청년정책조정실 — 인벤토리 운영 기준과 등록 지침, 기본계획 과제 체계</li>
          <li>· 한국고용정보원 — 온통청년 등록 화면·공개 API 개편, 운영 점검</li>
          <li>· 행정안전부 — 보조금24 서비스ID·표준 조건코드 제공, 지방재정365 세부사업 코드 연계</li>
          <li>· 기획예산처 — 열린재정(디지털예산회계) 세부사업 코드 연계</li>
          <li>· 중앙부처·지방자치단체 — 등록과 확인(1단계 시범 참여)</li>
        </ul>
        <p className="mt-3 text-[11.5px] text-ink-3">비공식 개념검증(PoC)의 구상이며 기관의 공식 입장이 아닙니다.</p>
      </section>
    </div>
  );
}

function Box({ tag, title, lines, dark }: { tag: string; title: string; lines: string[]; dark?: boolean }) {
  return (
    <div className={`rounded-[18px] border p-5 ${dark ? "border-ink bg-ink text-onink" : "border-hair bg-card"}`}>
      <p className={`text-[11.5px] font-semibold ${dark ? "opacity-60" : "text-ink-3"}`}>{tag}</p>
      <p className="mt-1 text-[16px] font-bold tracking-[-0.02em]">{title}</p>
      <ul className={`mt-2.5 space-y-1 text-[12.5px] leading-[1.6] ${dark ? "opacity-85" : "text-ink-2"}`}>
        {lines.map((l) => (
          <li key={l}>· {l}</li>
        ))}
      </ul>
    </div>
  );
}

function Arrow() {
  return (
    <span className="hidden self-center text-[22px] text-ink-3 lg:block" aria-hidden>
      →
    </span>
  );
}
