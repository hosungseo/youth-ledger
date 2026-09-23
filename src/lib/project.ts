import "server-only";
import { geoArea, geoMercator, geoPath } from "d3-geo";
import type { MapShape } from "./types";
import { sido, sigunguGeo } from "./data";

export const MAP_W = 620;
export const MAP_H = 760;

type Ring = [number, number][];

/**
 * d3-geo reads rings on the sphere: an exterior ring wound the "wrong" way is
 * taken as everything except the polygon (area > 2π) and floods the map.
 * A few SGIS shapes (옹진군, 화성시 …) arrive that way, so flip them.
 */
function rewind<T extends { type: string; coordinates: unknown }>(g: T): T {
  // per polygon: a MultiPolygon can mix correctly and wrongly wound parts
  const fix = (rings: Ring[]) =>
    geoArea({ type: "Polygon", coordinates: rings } as never) > 2 * Math.PI ? rings.map((r) => [...r].reverse()) : rings;
  if (g.type === "Polygon") return { ...g, coordinates: fix(g.coordinates as Ring[]) };
  return { ...g, coordinates: (g.coordinates as Ring[][]).map(fix) };
}

let cache: MapShape[] | null = null;
let projectionCache: ReturnType<typeof geoMercator> | null = null;

/** 광역 outlines (sido.json) in the same projection as the 시군구 shapes. */
export function sidoOutlines(): { sido: string; d: string }[] {
  sigunguShapes();
  const path = geoPath(projectionCache!).digits(1);
  return sido.features.map((f) => ({
    sido: f.properties.name,
    d: path({ ...f, geometry: rewind(f.geometry) } as never) ?? "",
  }));
}

/** Project every 시군구 once at build time; the client only receives path strings. */
export function sigunguShapes(): MapShape[] {
  if (cache) return cache;
  const features = sigunguGeo.features.map((f) => ({ ...f, geometry: rewind(f.geometry) }));
  const fc = { type: "FeatureCollection", features } as never;
  const projection = geoMercator().fitExtent([[12, 12], [MAP_W - 12, MAP_H - 12]], fc);
  projectionCache = projection;
  const path = geoPath(projection).digits(1);
  cache = features.map((f) => {
    const [cx, cy] = path.centroid(f as never);
    return {
      code: f.properties.code,
      name: f.properties.name,
      sido: f.properties.sido,
      d: path(f as never) ?? "",
      cx: Math.round(cx * 10) / 10,
      cy: Math.round(cy * 10) / 10,
    };
  });
  return cache;
}
