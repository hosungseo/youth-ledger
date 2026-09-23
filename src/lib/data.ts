import "server-only";
import programsRaw from "../../data/programs.json";
import metaRaw from "../../data/meta.json";
import sidoRaw from "../../data/sido.json";
import fiscalRaw from "../../data/fiscal.json";
import fiscalProgramsRaw from "../../data/fiscal-programs.json";
import execRaw from "../../data/exec.json";
import vendorsRaw from "../../data/vendors.json";
import linkRaw from "../../data/link.json";
import sigunguRaw from "../../data/sigungu-geo.json";
import qualityRaw from "../../data/quality.json";
import recordsRaw from "../../data/records.json";
import type {
  ExecData,
  FiscalMeta,
  FiscalProgram,
  LinkData,
  PolicyRecord,
  QualityData,
  Meta,
  Program,
  SidoCollection,
  VendorData,
} from "./types";

export const programs = programsRaw as Program[];
export const meta = metaRaw as Meta;
export const sido = sidoRaw as SidoCollection;

/** The same axes read from the budget systems instead of 온통청년. */
export const fiscal = fiscalRaw as {
  meta: FiscalMeta;
  rows: unknown[];
};

/** 일별 집행 시계열. 지방만 있다 — 중앙은 집행 자료가 없다. */
export const exec = execRaw as ExecData;

/** 위탁으로 나간 돈에 이름을 붙일 수 있는지 — 계약현황과 맞대 본 결과. */
export const vendors = vendorsRaw as VendorData;

/** One row per 세부사업, for the 목록 and the 비교. */
export const fiscalPrograms = fiscalProgramsRaw as FiscalProgram[];

export function getProgram(id: string): Program | undefined {
  return programs.find((p) => p.id === id);
}

export function programsByRegion(region: string): Program[] {
  return programs.filter((p) => p.region === region);
}

/** Same-type siblings from elsewhere — "다른 지역의 비슷한 사업". */
export function relatedPrograms(p: Program, limit = 6): Program[] {
  return programs
    .filter((q) => q.id !== p.id && q.type === p.type && q.region !== p.region)
    .sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0))
    .slice(0, limit);
}

/** 종합 화면 — 온통청년·보조금24·지방재정365·열린재정·KOSIS 인구를 지자체 단위로 묶은 것. */
export const link = linkRaw as unknown as LinkData;

/** SGIS 2020 시군구 경계(현행 지자체만). 서버에서만 투영해 쓴다. */
export const sigunguGeo = sigunguRaw as unknown as {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: { code: string; name: string; sido: string }; geometry: { type: string; coordinates: unknown } }[];
};

/** 온통청년 자체 데이터 점검 — 매칭 없이 센 것만. */
export const quality = qualityRaw as unknown as QualityData;

/** Inventory record of one 온통청년 policy — only the policy page reads it (build time). */
const records = recordsRaw as unknown as Record<string, PolicyRecord>;
export const getRecord = (id: string): PolicyRecord | undefined => records[id];
