import type { MetadataRoute } from "next";
import { programs } from "@/lib/data";
import { REGION_SLUG } from "@/lib/design";
import { SITE_URL } from "@/lib/site";

/**
 * 사업 상세가 508장이라 손으로 적을 수 없다. 자료에서 그대로 편다.
 * 재정 기준의 중앙은 지역 페이지가 없으므로 뺀다(/fiscal/region/central 없음).
 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const at = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    priority,
  });

  const fixed = [
    at("/", 1),
    at("/notice/plate", 0.9),
    at("/fiscal/plate", 0.9),
    at("/notice/list", 0.8),
    at("/fiscal/list", 0.8),
    at("/notice/types", 0.7),
    at("/fiscal/sectors", 0.7),
    at("/fiscal/exec", 0.7),
    at("/about", 0.5),
  ];

  const regions = Object.entries(REGION_SLUG).flatMap(([region, slug]) => [
    at(`/notice/region/${slug}`, 0.6),
    ...(region === "중앙" ? [] : [at(`/fiscal/region/${slug}`, 0.6)]),
  ]);

  const details = programs.map((p) => at(`/notice/program/${p.id}`, 0.4));

  return [...fixed, ...regions, ...details];
}
