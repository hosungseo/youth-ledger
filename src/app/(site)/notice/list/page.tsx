import { Suspense } from "react";
import type { Metadata } from "next";
import { fiscal, meta, programs } from "@/lib/data";
import { toListProgram } from "@/lib/types";
import ExploreClient from "./ExploreClient";
import ListHeader from "@/components/ListHeader";

export const metadata: Metadata = {
  title: "목록",
  description: "온통청년에 등록된 청년정책을 지역·분야·신청시기로 걸러 봅니다.",
};

export default function NoticeListPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8">
      <ListHeader
        title="청년정책 목록"
        lede={`온통청년에 등록된 ${meta.total.toLocaleString("ko-KR")}건입니다. 이름·기관·지원대상 어느 쪽으로도 찾을 수 있습니다.`}
        other={{ label: "재정 기준", total: fiscal.meta.total }}
      />
      <Suspense fallback={<div className="py-20" />}>
        <ExploreClient programs={programs.map(toListProgram)} meta={meta} />
      </Suspense>
    </div>
  );
}
