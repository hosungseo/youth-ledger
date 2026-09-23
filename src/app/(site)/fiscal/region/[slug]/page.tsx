import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fiscal, fiscalPrograms, meta, sido } from "@/lib/data";
import { REGION_FULL, REGION_SLUG, SLUG_REGION } from "@/lib/design";
import FiscalRegion from "@/components/FiscalRegion";

export function generateStaticParams() {
  // 중앙은 부처별로 나뉘므로 지역 페이지가 없다.
  return Object.entries(REGION_SLUG)
    .filter(([region]) => region !== "중앙")
    .map(([, slug]) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const region = SLUG_REGION[(await params).slug];
  if (!region || region === "중앙") return { title: "찾을 수 없는 지역" };
  return {
    title: `${REGION_FULL[region]} 재정`,
    description: `${REGION_FULL[region]}의 청년 세부사업과 집행률, 온통청년 등록 여부.`,
  };
}

export default async function FiscalRegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const region = SLUG_REGION[(await params).slug];
  if (!region || region === "중앙") notFound();

  return (
    <FiscalRegion
      region={region}
      all={fiscalPrograms}
      fiscalMeta={fiscal.meta}
      geo={sido}
      meta={meta}
    />
  );
}
