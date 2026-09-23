import type { Metadata } from "next";
import Link from "next/link";
import { fiscal, link, quality } from "@/lib/data";

export const metadata: Metadata = {
  title: "제안",
  description: "온통청년을 중심에 두고 시행계획·보조금24·지방재정365·열린재정을 정책 ID 하나로 잇는 범정부 청년정책 인벤토리 구상과 단계별 추진안.",
};

const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/youth-ledger";

export default function ProposalPage() {
  const q = quality;
  const est = fiscal.meta.absentEstimate;
  const support = est?.byKind?.["대상자 지원"];
  const cp = link.coveragePolicy;
  const s = q.timingSeason;

  // measured today → target (2027년 말, 협의 예시)
  const baseline: { k: string; now: string; to: string; how: string }[] = [
    { k: "대상자 지원형 청년 세부사업의 온통청년 확인 비율(지방)", now: support ? `약 ${Math.round(100 - support.share)}%(표본 추정)` : "—", to: "90% 이상", how: "시행계획의 세부사업 코드로 빈자리 목록 자동 산출 → 등록기관 확인" },
    { k: "시행계획 과제 중 온통청년 정책과 연결된 비율", now: "1단계에서 산정", to: "100%", how: "과제번호(온통청년 전 건 기재)로 연결" },
    { k: "보조금24 대응 서비스가 있는 정책의 서비스ID 기재", now: "5%(24/495건)", to: "100%", how: "등록 때 서비스ID 선택(목록 조회)" },
    { k: "1~4월 마감 정책의 마감 뒤 등록", now: pct(s.janApr.late, s.janApr.n), to: "10% 이하", how: "지난해 정책의 새 회차 선등록 허용" },
    { k: "지금 신청 가능 상태로 겹치는 등록", now: `${q.dup.openDup}건`, to: "0건", how: "정책 ID는 한 번, 연도·차수·지역은 회차로" },
    { k: "신청 가능 정책의 신청 바로가기(URL·서비스ID) 입력", now: `${pct(q.apply.openWithUrl, q.apply.open)}(${q.apply.openWithUrl}/${q.apply.open}건)`, to: "90% 이상", how: "URL 또는 서비스ID를 구조화 항목으로" },
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[860px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
        새 시스템이 아니라,
        <br />
        이미 있는 자료를 번호 하나로.
      </h1>
      <p className="mt-5 max-w-[720px] text-[15px] leading-[1.85] text-ink-2">
        청년정책 전담조직이 정책을 조정하려면 먼저 ‘무엇을, 누가, 누구에게, 얼마로’ 하는지 한 목록이 있어야 합니다. 재료는 이미 있습니다 — 과제·예산·실적은
        시행계획에, 정책 안내는 온통청년에, 자격 안내와 신청은 보조금24에, 편성과 집행은 지방재정365·열린재정에. 비어 있는 것은 이것들을 잇는{" "}
        <b className="font-semibold text-ink">번호와 등록 기준</b>입니다. 청년기본법은 통합정보시스템의 목적으로 ‘정보 공유 및 기관 간 서비스 연계’를 들고(제24조의5),
        제2차 기본계획은 ‘온통청년 고도화’(지자체 플랫폼 자동 연동·신속한 현행화·맞춤형 추천)를 과제로 두고 있습니다. 이 구상은 그 과제를 인벤토리 기능으로 넓히는 것입니다.
      </p>

      {/* roles */}
      <section className="mt-12">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">역할 나누기</h2>
        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] lg:items-stretch">
          <Box tag="원천" title="등록기관" lines={["중앙부처 · 광역(시·군·구분 취합)", "사업을 만들 때 한 번, 새 회차는 먼저 등록", "정책 ID · 회차 · 과제번호 · 신청 바로가기"]} />
          <Arrow />
          <Box
            tag="기준 목록 · 국무조정실 주관"
            title="온통청년 → 청년정책 인벤토리"
            lines={["범정부 청년정책의 단일 목록과 정책 ID", "예산·집행은 재정정보에서, 조건코드는 보조금24에서 끌어와 표시", "중복·사각지대·과제별 현황을 정기 산출"]}
            dark
          />
          <Arrow />
          <Box tag="쓰는 곳" title="청년 · 전담조직 · 지자체" lines={["청년: 맞춤형 추천으로 찾고 기존 신청처로 신청", "전담조직: 과제별 예산·중복·빈칸으로 조정", "지자체: 우리 지역 등록 상태 확인"]} />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Box tag="연계" title="시행계획" lines={["과제별 세부사업 코드를 제출 서식에서 받음(연 1회)", "등록기관의 입력 부담을 늘리지 않음"]} />
          <Box tag="연계" title="보조금24" lines={["연령·소득·가구 표준 조건코드와 서비스ID 제공", "현금·바우처형 서비스의 신청 연결"]} />
          <Box tag="연계" title="지방재정365 · 열린재정" lines={["세부사업 예산현액·집행액·재원", "인벤토리는 코드만 들고 값은 끌어옴"]} />
        </div>
      </section>

      {/* ID chain */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">번호 체계</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          사업마다 바뀌지 않는 정책 ID 하나를 두고, 나머지 번호를 연결값으로 매답니다. 해마다·지역마다 새로 올리던 공고는 같은 ID 아래 ‘회차’가 됩니다.
          세부사업 코드는 정책과 여러 대 여러로 이어지므로 연결표로 두고 시행계획 제출 때 해마다 갱신합니다.
        </p>
        <div className="mt-5 flex flex-wrap items-stretch gap-2">
          {[
            ["정책 ID", "사업에 한 번 · 바뀌지 않음"],
            ["회차", "연도·차수·대상 지역"],
            ["기본계획 과제번호", "이미 전 건 기재"],
            ["보조금24 서비스ID", "조건코드·신청"],
            ["재정사업 코드", "연결표 · 연 1회 갱신"],
          ].map(([a, b], i) => (
            <div key={a} className="flex items-stretch gap-2">
              {i > 0 && <span className="self-center text-ink-3" aria-hidden>·</span>}
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
          왼쪽은 이 대장이 공개 자료로 잰 현재 값, 목표는 2027년 말을 가정한 협의용 예시입니다. 같은 방법으로 반기마다 재면 그대로 추진 지표가 됩니다.
        </p>
        <div className="mt-5 overflow-x-auto rounded-[20px] border border-hair bg-card">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="border-b border-hair text-left text-[12px] text-ink-3">
                <th className="px-5 py-3 font-semibold">지표</th>
                <th className="px-4 py-3 font-semibold">지금</th>
                <th className="px-4 py-3 font-semibold">목표(예시)</th>
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
          첫 줄은 표본 추정(AI 판정 기반), 나머지는 전수 집계입니다. 공통 번호가 없어 자동으로 이어지지 않는 정책은 지금 {pct(cp.none, cp.total)}입니다. 산정 방법은{" "}
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
      <section className="mt-14 grid gap-6 lg:grid-cols-3">
        <FieldList title="등록기관이 넣는 것" items={["정책 ID(최초 1회) · 회차", "기본계획 과제번호", "신청 바로가기(URL 또는 보조금24 서비스ID)", "신청기간", "지원 인원(‘제한 없음’ 구분)"]} />
        <FieldList title="시행계획 제출 때 받는 것" items={["과제별 세부사업 코드(중앙·시도, 매년 1. 31.)", "시·군·구분은 시·도 청년정책책임관이 취합"]} />
        <FieldList
          title="자동으로 채워지는 것"
          items={["예산현액·집행액·재원 — 지방재정365·열린재정에서", "자격조건 표준코드 — 보조금24 서비스ID로", "신청 상태 — 신청기간에서 계산", "중앙/지자체 구분·대상 지역 — 기관코드에서"]}
        />
      </section>

      {/* steps */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">단계별 추진(안)</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            ["1단계 · 2026. 10.~11.", "실무 협의. 2027년도 시행계획 수립 지침(11. 30. 통보)에 세부사업 코드·서비스ID 기재 반영 협의. 자동 대조 결과를 운영기관 자료와 함께 확인, 희망 광역 한 곳 시범."],
            ["2단계 · 2027년 상반기", "시행계획 제출분(1. 31.)으로 과제–재정 연결표 구축. 지난해 정책의 새 회차 선등록 운영."],
            ["3단계 · 2027년 하반기~", "등록 화면에서 과제번호·서비스ID·세부사업 코드 조회(유지보수 범위 우선). 인벤토리 공개 API."],
            ["4단계 · 전담조직 출범 후", "중복·빈칸·연초 등록 지표를 반기마다 산출해 등록기관에 환류, 전담조직의 조정 자료로."],
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
          <li>· 국무조정실 청년정책조정실(주관) — 실무 협의, 시행계획 과제 목록, 2027년도 시행계획 지침 반영 검토</li>
          <li>· 한국고용정보원 — 운영 자료(미게시 포함) 기준 공동 확인, 회차·지역 항목 설계</li>
          <li>· 행정안전부 — 보조금24 서비스ID·표준 조건코드 제공, 지방재정365 세부사업 코드 연계</li>
          <li>· 기획예산처 — 열린재정 세부사업 코드 연계</li>
          <li>· 교육부·한국장학재단 — 국가장학금(기본계획 과제)의 온통청년 등록</li>
          <li>· 중앙부처·지방자치단체 — 1단계 대조 결과 확인, 시범 참여</li>
        </ul>
        <p className="mt-4 text-[13px] text-ink-2">
          1단계 확인 목록(자동 대조 결과) ·{" "}
          <a href={`${BASE}/data/csv/policies.csv`} download className="font-semibold underline underline-offset-2 hover:text-ink">정책별 연결표</a> ·{" "}
          <a href={`${BASE}/data/csv/budget.csv`} download className="font-semibold underline underline-offset-2 hover:text-ink">세부사업 대조표</a> ·{" "}
          <a href={`${BASE}/data/csv/gov24.csv`} download className="font-semibold underline underline-offset-2 hover:text-ink">보조금24 미연결 서비스</a>
        </p>
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

function FieldList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="text-[20px] font-bold tracking-[-0.025em]">{title}</h2>
      <ul className="mt-4 space-y-1.5 text-[13.5px] text-ink-2">
        {items.map((x) => (
          <li key={x} className="flex gap-2.5">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
            {x}
          </li>
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
