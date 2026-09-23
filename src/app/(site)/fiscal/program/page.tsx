import { Suspense } from "react";
import type { Metadata } from "next";
import FiscalRecordView from "@/components/fiscal/FiscalRecordView";

export const metadata: Metadata = {
  title: "세부사업",
  description: "예산서에 잡힌 청년 세부사업 한 건 — 예산·집행 추이·재원과, 온통청년에 대응하는 정책이 있는지.",
};

/**
 * One 세부사업 record. 6천여 건을 정적 페이지로 찍으면 배포가 1GB를 넘으므로,
 * 껍데기 한 장만 두고 지역별 자료(public/data/fp/<지역>.json)를 브라우저에서 읽는다.
 */
export default function FiscalProgramPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8">
      <Suspense fallback={<p className="py-20 text-[14px] text-ink-3">세부사업을 불러오는 중…</p>}>
        <FiscalRecordView />
      </Suspense>
    </div>
  );
}
