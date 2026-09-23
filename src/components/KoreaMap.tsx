"use client";

import { useMemo, useId } from "react";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, MultiPolygon } from "geojson";
import type { SidoCollection } from "@/lib/types";

const W = 560;
const H = 660;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Small metros get a leader line so their label clears the coastline. */
const LABEL_NUDGE: Record<string, [number, number]> = {
  서울: [-34, -14], 인천: [-46, 4], 세종: [-30, -30], 대전: [40, 6],
  광주: [-40, 8], 대구: [44, -4], 울산: [46, 6], 부산: [40, 20],
};

export interface MapSkin {
  from: string;
  to: string;
  stroke: string;
  label: string;
  labelHalo: string;
  count: string;
  leader: string;
}

export const DEFAULT_SKIN: MapSkin = {
  from: "var(--color-t-biz)", to: "var(--color-biz-fg)", stroke: "var(--color-paper)",
  label: "var(--color-ink)", labelHalo: "var(--color-paper)",
  count: "var(--color-biz-fg)", leader: "var(--color-ink)",
};

export interface MapDatum {
  /** Regions sharing a group are one administration and are shaded alike. */
  group: string;
  value: number;
  label: string;
}

export default function KoreaMap({
  geo,
  data,
  skin = DEFAULT_SKIN,
  active,
  onHover,
  hovered,
  format = (n) => String(n),
}: {
  geo: SidoCollection;
  /** Keyed by the 시도 short name the boundary file uses. */
  data: Record<string, MapDatum>;
  skin?: MapSkin;
  /** Group key to outline, e.g. the region whose page this is. */
  active?: string;
  onHover?: (group: string | null) => void;
  hovered?: string | null;
  format?: (n: number) => string;
}) {
  const gradId = useId();

  const { paths, centroids, max } = useMemo(() => {
    const fc = geo as unknown as { features: Feature<MultiPolygon>[] };
    const projection = geoMercator().fitExtent(
      [[24, 24], [W - 24, H - 24]],
      fc as never,
    );
    const path = geoPath(projection);
    return {
      paths: geo.features.map((f, i) => ({
        name: f.properties.name,
        full: f.properties.fullName,
        d: path(fc.features[i] as never) ?? "",
      })),
      centroids: Object.fromEntries(
        geo.features.map((f, i) => {
          // Rounded: server and client disagree in the last float digits, which
          // React reports as a hydration mismatch on every label.
          const [cx, cy] = path.centroid(fc.features[i] as never);
          return [f.properties.name, [round2(cx), round2(cy)]];
        }),
      ) as Record<string, [number, number]>,
      max: Math.max(1, ...Object.values(data).map((d) => d.value)),
    };
  }, [geo, data]);

  // sqrt keeps the sparse provinces from vanishing against the dense ones.
  const shade = (n: number) => (n <= 0 ? 0 : 0.14 + 0.86 * Math.sqrt(n / max));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label="시도별 분포 지도"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin.from} />
          <stop offset="100%" stopColor={skin.to} />
        </linearGradient>
      </defs>

      {paths.map((p) => {
        const d = data[p.name];
        const group = d?.group ?? p.name;
        const on = hovered === group || active === group;
        return (
          <path
            key={p.name}
            d={p.d}
            fill={`url(#${gradId})`}
            fillOpacity={on ? 1 : shade(d?.value ?? 0)}
            stroke={active === group ? skin.label : skin.stroke}
            strokeWidth={active === group ? 2 : on ? 1.6 : 0.9}
            className="transition-[fill-opacity,stroke-width] duration-200"
            onMouseEnter={() => onHover?.(group)}
            onMouseLeave={() => onHover?.(null)}
          />
        );
      })}

      {paths.map((p) => {
        const [cx, cy] = centroids[p.name] ?? [0, 0];
        const [dx, dy] = LABEL_NUDGE[p.name] ?? [0, 0];
        const d = data[p.name];
        const nudged = dx !== 0 || dy !== 0;
        return (
          <g key={`label-${p.name}`} className="pointer-events-none">
            {nudged && (
              <line
                x1={cx} y1={cy}
                x2={cx + dx * 0.62} y2={cy + dy * 0.62}
                stroke={skin.leader} strokeOpacity={0.28} strokeWidth={0.8}
              />
            )}
            <text
              x={cx + dx} y={cy + dy}
              textAnchor="middle" className="tnum"
              fontSize="12.5" fontWeight="700"
              fill={skin.label} stroke={skin.labelHalo} strokeWidth="3.2" paintOrder="stroke"
            >
              {p.name}
            </text>
            {d && (
              <text
                x={cx + dx} y={cy + dy + 14}
                textAnchor="middle" className="tnum"
                fontSize="11.5" fontWeight="600"
                fill={skin.count} stroke={skin.labelHalo} strokeWidth="3" paintOrder="stroke"
              >
                {format(d.value)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
