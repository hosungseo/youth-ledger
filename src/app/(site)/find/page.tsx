import type { Metadata } from "next";
import { Suspense } from "react";
import FindClient from "@/components/find/FindClient";

export const metadata: Metadata = {
  title: "내 조건으로 찾기",
  description: "사는 곳·나이·소득·상태를 넣으면 온통청년·보조금24·예산서에서 받을 수 있는 청년정책을 한 번에 봅니다.",
};

export default function FindPage() {
  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <h1 className="max-w-[820px] text-[34px] leading-[1.18] font-bold tracking-[-0.035em] text-balance md:text-[46px]">
        내 조건이면
        <br />
        무엇을 받을 수 있나.
      </h1>
      <p className="mt-5 max-w-[680px] text-[15px] leading-[1.85] text-ink-2">
        같은 청년이라도 온통청년, 보조금24, 지자체 예산서가 보여 주는 목록이 다릅니다. 조건을 넣으면 세 곳을 한꺼번에 걸러,
        어디에 무엇이 있는지와 서로 얼마나 겹치는지를 보여 줍니다. 입력한 조건은 주소창에만 남고 어디에도 저장되지 않습니다.
      </p>
      <div className="mt-8">
        {/* filters come from the URL on the client — the page is a static export */}
        <Suspense fallback={<p className="py-10 text-[14px] text-ink-3">불러오는 중…</p>}>
          <FindClient />
        </Suspense>
      </div>
    </div>
  );
}
