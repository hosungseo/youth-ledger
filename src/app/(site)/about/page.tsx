import Link from "next/link";
import type { Metadata } from "next";
import { exec, fiscal, meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "자료 출처와 한계",
  description: "청년대장이 무엇을 담고 무엇을 담지 않는지, 연결은 얼마나 정확한지.",
};

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/youth-ledger";
const DOWNLOADS = [
  { file: "policies.csv", title: "온통청년 정책별 연결표", body: "정책마다 기본계획 과제번호, 보조금24 서비스ID(연결 방식), 이어지는 예산서 세부사업 코드, 같은 사업의 다른 등록 번호." },
  { file: "budget.csv", title: "예산서 청년 세부사업 대조표", body: "세부사업마다 예산·집행과 온통청년 대응 정책(자동 판정), 없으면 이름이 가장 가까운 후보와 유사도." },
  { file: "gov24.csv", title: "온통청년과 이어지지 않은 보조금24 청년 관련 서비스", body: "자동 대조로 짝을 찾지 못한 서비스. 표본 확인에서 약 3분의 1은 청년이 주 대상이 아니었으므로 검토용으로 쓰세요." },
];

export default function AboutPage() {
  const est = fiscal.meta.absentEstimate;
  return (
    <div className="mx-auto max-w-[720px] px-5 py-12 md:px-8">
      <h1 className="text-[34px] leading-[1.15] font-bold tracking-[-0.035em] md:text-[44px]">
        무엇을 담았나
      </h1>
      <p className="mt-5 text-[14px] leading-[1.8] text-ink-3">
        청년대장은 공개 자료로 만든 비공식 개념검증(PoC)입니다. 온통청년·보조금24·지방재정365·열린재정의
        공식 화면이 아니며, 기관의 공식 입장도 아닙니다.
      </p>

      <div className="mt-8 space-y-10">
        <Section title="출처">
          <ul className="space-y-1.5">
            <Li>
              <b className="font-semibold text-ink">온통청년</b> — 공개 정책검색 결과 {meta.total.toLocaleString("ko-KR")}건
              (중앙부처 {meta.central}건, 지방자치단체 {meta.local.toLocaleString("ko-KR")}건). 온통청년 검색 화면에 표시되는 건수와 같습니다(지역 필터 결과도 일치 확인).
            </Li>
            <Li>
              <b className="font-semibold text-ink">보조금24</b> — 공공데이터포털 「행정안전부_대한민국 공공서비스(혜택) 정보」 목록·상세·지원조건.
            </Li>
            <Li>
              <b className="font-semibold text-ink">지방재정365</b> — 세부사업별 세출현황(2026, 9월 21일 기준)에서 이름에 청년이 들어간 세부사업.
            </Li>
            <Li>
              <b className="font-semibold text-ink">열린재정</b> — 세부사업 일별 집행현황(2026, 9월 14일 기준)의 중앙 세부사업.
            </Li>
            <Li>
              <b className="font-semibold text-ink">KOSIS 주민등록인구</b> — 행정구역(읍면동)별/5세별 주민등록인구에서 20~39세를 청년 인구로 셌습니다(종합 화면의 청년 1인당 예산). 청년기본법상 청년은 19~34세이고 지자체 조례는 대부분 39세 이하라, 5세 구간 중 조례 기준에 가까운 쪽을 썼습니다.
            </Li>
            <Li>
              <b className="font-semibold text-ink">지도 경계</b> — SGIS 2020 시군구 경계. 2026년 신설된 인천 영종·제물포·서해·검단구는 경계가 없어 지도에서 비어 있습니다.
            </Li>
            <Li>
              <b className="font-semibold text-ink">집행 추이</b> — 지방재정365를 매주(6월 10일부터 매일) 받아 둔 스냅샷{" "}
              {exec.meta.days}개에서 누적 지출을 이었습니다. 세부사업 카드의 집행 추이는 주 단위 시점으로 그렸고, 중앙은 열린재정의 당월 누계 집행액을 이었습니다.
            </Li>
          </ul>
          <p>
            담당자 성명·연락처와 등록·수정자 관련 항목은 수집 단계에서 지웠고, 이 사이트에 싣지 않았습니다.
          </p>
        </Section>

        <Section title="가공한 부분">
          <ul className="space-y-1.5">
            <Li>
              <b className="font-semibold text-ink">분야</b> — 온통청년은 신·구 분류체계가 섞여 있어(예: {"'복지문화'"}와{" "}
              {"'금융・복지・문화'"}) 중분류를 여덟 갈래로 다시 묶었습니다. 예산서에는 분야가 없어 사업명으로 추정했고,
              단서가 없는 센터·공간·운영비는 ‘정책기반’으로 모았습니다.
            </Li>
            <Li>
              <b className="font-semibold text-ink">지역</b> — 온통청년의 대상 지역 목록으로 시도를 정했습니다. 셋 넘는 시도에 걸친
              정책과 중앙부처 정책은 ‘중앙’으로 셉니다. 광주·전남은 통합 이후 한 광역이지만, 시·군·구 이름으로 갈라 지도에 얹었습니다.
            </Li>
            <Li>
              <b className="font-semibold text-ink">신청 시기</b> — 신청 시작일부터 종료일까지 걸친 2026년의 달마다 셉니다.
              신청기간이 없고 상시도 아닌 {meta.undecided}건은 월별 막대에서 빠집니다.
            </Li>
            <Li>
              <b className="font-semibold text-ink">예산</b> — 온통청년에는 예산 항목이 없습니다. 이름·대상 지역이 맞는 예산서
              세부사업이 있는 {(meta.withBudget ?? 0).toLocaleString("ko-KR")}건에만 그 예산현액을 붙였습니다.
            </Li>
          </ul>
        </Section>

        <Section title="연결은 얼마나 정확한가">
          <p>
            세 자료에는 서로를 가리키는 공통 번호가 없어, 기관코드·이름·지원내용으로 이었습니다. 그래서 정확도를 따로 쟀습니다 —
            점수 구간별로 표본을 뽑아 AI가 관점을 나눠 두 번(서로 결과와 점수를 보지 않고) 판정하고, 엇갈린 것은 원문을 대조해 확정했습니다. 사람이 직접 확인한 표본은 아직 없으므로, 수치는 등록기관 확인으로 확정해야 합니다.
          </p>
          <ul className="space-y-1.5">
            <Li>
              <b className="font-semibold text-ink">온통청년 ↔ 보조금24</b> — 표본 210쌍. 신뢰도 ‘높음’ 약 98%, ‘중간’ 약 90%가 올바른
              연결이었습니다(‘중간’에는 시·군 사업을 광역·중앙 상위 서비스에 잇는 경우가 많습니다).
            </Li>
            <Li>
              <b className="font-semibold text-ink">예산서 ↔ 온통청년(지방)</b> — 표본 {fiscal.meta.accuracy?.sample}건. ‘온통청년에 있음’ 자동 판정은 약{" "}
              {fiscal.meta.accuracy?.presence}%, ‘없음’ 판정은 약 {fiscal.meta.accuracy?.absence}%가 맞았고, 정책별 예산 연결(엄격 기준)은 약{" "}
              {fiscal.meta.accuracy?.strict}%가 맞았습니다.
              {est && (
                <>
                  {" "}지방 청년 세부사업 가운데 실제로 온통청년에 없는 비율은 표본을 모집단 크기로 가중해{" "}
                  <b className="font-semibold text-ink">약 {est.absentShare}%(95% 구간 {est.ci[0]}~{est.ci[1]}%)</b>로 추정합니다.
                </>
              )}
            </Li>
            <Li>
              <b className="font-semibold text-ink">예산서 ↔ 온통청년(중앙)</b> — 건수가 적고 금액이 커서 한 건씩 대조했습니다.
            </Li>
          </ul>
          <ul className="space-y-1.5">
            <Li>
              <b className="font-semibold text-ink">청년 세부사업의 범위</b> — 세부사업명에 ‘청년’ 또는 대학생·자립준비·보호종료 등이 들어간 사업입니다.
              이름만 보는 최소 범위이고, 노인 대상 ‘청춘’ 사업(청춘극장·청춘대학 등), 부서 기본경비·인력운영비, 청년회의소 지원은 뺐습니다.
            </Li>
          </ul>
          <p>
            1:1 연결이 어려운 가장 큰 이유는 온통청년에 회차·지역 항목이 없어 같은 사업이 해마다·지역마다 새 건으로 등록되는 구조입니다.
            정책마다 바뀌지 않는 ID를 두고 예산 코드와 보조금24 서비스ID를 함께 받으면 이 문제는 사라집니다.
          </p>
        </Section>

        <Section title="내려받기">
          <p>이 시제품이 이어 본 결과를 표로 내려받을 수 있습니다. 엑셀에서 바로 열리는 UTF-8(BOM) CSV입니다. 연결은 자동 대조 결과이므로 확인용 목록으로 쓰세요.</p>
          <ul className="space-y-2">
            {DOWNLOADS.map((d) => (
              <li key={d.file} className="rounded-[14px] border border-hair bg-card p-4">
                <a href={`${BASE}/data/csv/${d.file}`} download className="text-[15px] font-semibold text-ink underline underline-offset-2">
                  {d.title}
                </a>
                <span className="ml-2 text-[12px] text-ink-3">{d.file}</span>
                <p className="mt-1 text-[13px] leading-[1.65] text-ink-3">{d.body}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="한계">
          <ul className="space-y-1.5">
            {fiscal.meta.caveats.map((c) => (
              <Li key={c}>{c}</Li>
            ))}
            {exec.meta.caveats.map((c) => (
              <Li key={c}>{c}</Li>
            ))}
          </ul>
        </Section>

        <p className="border-t border-hair pt-6 text-[13px] text-ink-3">
          틀을 빌려 온 곳 ·{" "}
          <a href="https://changup.seohosung.com" target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:text-ink">
            창업대장
          </a>
          (같은 방식으로 창업지원사업을 모은 자매 사이트) ·{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-ink">
            처음으로
          </Link>
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[13px] font-semibold text-ink-3">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-[1.8] text-ink-2">{children}</div>
    </section>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
