"use client";

import KoreaMap, { type MapDatum } from "@/components/KoreaMap";
import type { Meta, SidoCollection } from "@/lib/types";

const GROUP: Record<string, string> = { 광주: "전남광주", 전남: "전남광주" };
const groupOf = (r: string) => GROUP[r] ?? r;

/** Where this 시도 sits, and how full its neighbours are. */
export default function RegionLocator({
  geo,
  meta,
  region,
}: {
  geo: SidoCollection;
  meta: Meta;
  region: string;
}) {
  const counts = new Map<string, number>();
  for (const [r, stat] of Object.entries(meta.byRegion)) {
    if (r === "중앙") continue;
    const g = groupOf(r);
    counts.set(g, (counts.get(g) ?? 0) + stat.count);
  }

  const data: Record<string, MapDatum> = {};
  for (const f of geo.features) {
    const g = groupOf(f.properties.name);
    data[f.properties.name] = { group: g, value: counts.get(g) ?? 0, label: g };
  }

  return <KoreaMap geo={geo} data={data} active={groupOf(region)} />;
}
