import type { Metadata } from "next";
import { Suspense } from "react";
import { fiscal, fiscalPrograms, meta } from "@/lib/data";
import FiscalExplore from "./FiscalExplore";
import ListHeader from "@/components/ListHeader";

export const metadata: Metadata = {
  title: "목록",
  description: "예산 자료에 잡힌 청년 세부사업. 온통청년에 있는지와 집행률까지 함께 봅니다.",
};

export default function FiscalListPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8">
      <ListHeader
        title="청년 세부사업"
        lede={`예산 자료에 잡힌 ${fiscal.meta.total.toLocaleString("ko-KR")}건입니다. 온통청년에 등록되지 않은 것까지 들어 있고, 온통청년에는 없는 집행률이 붙습니다.`}
        other={{ label: "온통청년 기준", total: meta.total }}
      />
      {/* filters come from the URL on the client — the page is a static export */}
      <Suspense fallback={<div className="py-20" />}>
        <FiscalExplore programs={fiscalPrograms.map(({ source: _s, match: _m, ...rest }) => rest)} meta={fiscal.meta} />
      </Suspense>
    </div>
  );
}
