export type Section = "central" | "local";

export interface When {
  months: number[];
  always: boolean;
  /** 공고가 나는 해. 2026년 사업이라도 2025년 말에 공고가 나는 것이 있다. */
  year: number | null;
  undecided: boolean;
  raw: string;
}

export interface Program {
  id: string;
  no: number;
  name: string;
  summary: string;
  section: Section;
  region: string;
  type: string;
  support: string[];
  target: string;
  budget: number | null;
  when: When;
  agency: string;
  agencyDept: string;
  operator: string;
  operatorDept: string;
  note: string;
  /** 원문에 소관기관이 비어 운영기관으로 채운 건. */
  agencyFromOperator: boolean;
  // 청년대장 확장: 온통청년 신청상태·링크, 보조금24 연결, 연결된 재정 세부사업
  status?: string;
  applyUrl?: string | null;
  onthongUrl?: string;
  gov24?: { id: string; name: string; url: string; conf: string } | null;
  fiscal?: { level: "central" | "local"; org: string; name: string; budget: number; executed: number }[];
}

export interface RegionStat {
  region: string;
  count: number;
  budget: number;
  types: Record<string, number>;
  agencies: { name: string; count: number }[];
}

export interface Meta {
  year: number;
  total: number;
  central: number;
  local: number;
  budgetTotal: number;
  regionCount: number;
  types: { value: string; count: number }[];
  regions: { value: string; count: number }[];
  agencies: { value: string; count: number }[];
  byRegion: Record<string, RegionStat>;
  monthHistogram: { month: number; count: number }[];
  alwaysOpen: number;
  /** 2025년에 이미 공고가 난 사업. 월별 막대에서는 빠진다. */
  alreadyAnnounced: number;
  /** '사업별 상이', '미정'처럼 시기를 못 박지 않은 사업. */
  undecided: number;
  source: string;
  /** 청년대장: 신청 가능(상시·진행중), 보조금24 연결, 재정 예산 연결 건수 */
  open?: number;
  withGov24?: number;
  withBudget?: number;
}

export interface SidoFeature {
  type: "Feature";
  properties: { code: string; name: string; fullName: string };
  geometry: { type: "MultiPolygon"; coordinates: number[][][][] };
}

export interface SidoCollection {
  type: "FeatureCollection";
  features: SidoFeature[];
}

export interface CentralMatchStat {
  count: number;
  budget: number;
}

export interface FiscalMeta {
  source: string;
  scannedLocal: number;
  scannedCentral: number;
  dropped: Record<string, number>;
  total: number;
  budgetTotal: number;
  typeIsInferred: boolean;
  centralMatch: Record<string, CentralMatchStat>;
  caveats: string[];
  /** 청년대장: 온통청년에 대응 정책이 있는 세부사업 수, 없는 비율 표본 추정 */
  inOnthong?: number;
  absentEstimate?: { absentShare: number; ci: number[]; absentBudgetShare: number; ciBudget: number[]; sample: number; population: number };
}

export interface FiscalProgram {
  id: string;
  level: "central" | "local";
  region: string;
  org: string;
  name: string;
  type: string;
  sector: string;
  budget: number;
  /** 집행액. 지방재정365만 제공하며 중앙은 null. */
  executed: number | null;
  source: string;
  /** 청년 키워드가 어느 층위에서 걸렸는지(사업=세부사업명, 활동=청년 주대상 지정). 중앙에만 의미가 있다. */
  match: "사업" | "활동" | "프로그램";
  /** 청년대장: 온통청년에 대응 정책이 있는지(자동 판정), 사업 성격, 대응 정책명 */
  inOnthong?: boolean;
  kind?: string;
  onthongName?: string | null;
}

export interface ExecOrg {
  org: string;
  region: string;
  budget: number;
  executed: number;
  cumulative: number[];
  programs: number;
}

export interface ExecRegion {
  region: string;
  budget: number;
  executed: number;
  cumulative: number[];
  programs: number;
}

export interface ExecData {
  meta: {
    source: string;
    first: string;
    last: string;
    days: number;
    events: number;
    undated: number;
    programs: number;
    budgetTotal: number;
    executedTotal: number;
    centralAvailable: boolean;
    caveats: string[];
  };
  days: string[];
  daily: number[];
  cumulative: number[];
  regions: ExecRegion[];
  orgs: ExecOrg[];
  depts: ExecDept[];
  deptMeta: {
    total: number;
    /** 예산을 달 수 있는 부서 수. 한 과만 쓰는 사업이 있어야 분모가 선다. */
    attributable: number;
    /** 집행이 붙은 세부사업 수. */
    programsWithExec: number;
    /** 여러 과가 나눠 써서 부서 집계에서 뺀 세부사업 수. */
    sharedPrograms: number;
  };
  /** 갈래 × 지자체. keys는 objects.groups의 key와 같은 순서다. */
  orgGroups: {
    keys: string[];
    rows: { org: string; executed: number; groups: number[] }[];
  };
  weekday: number[];
  months: { ym: string; amount: number }[];
  /** 통계목을 "누구 손을 거쳐 나갔나"로 묶은 것. build_exec.py의 OBJECT_GROUPS. */
  objects: {
    groups: ExecObjectGroup[];
    top: { name: string; group: string; amount: number; count: number }[];
    kinds: number;
    indirect: { amount: number; count: number };
    direct: { amount: number; count: number };
    monthEnd: { amount: number; byGroup: Record<string, number> };
  };
  byType: { type: string; budget: number; executed: number; programs: number }[];
  bySector: { sector: string; budget: number; executed: number; programs: number }[];
  /** 지자체 228곳 전부. 일별 시계열은 orgs(상위 60)에만 있고 여기는 월별이다. */
  orgMonthly: ExecOrgMonthly[];
  monthMeta: {
    last: string;
    /** 마지막으로 온전히 채워진 달. 순위의 기본값이 된다. */
    lastFullMonth: string;
    /** 마지막 달에 실제로 자료가 있는 날 수. */
    partialDays: number;
  };
}

export interface ExecDept {
  org: string;
  dept: string;
  budget: number;
  executed: number;
  programs: number;
  cumulative: number[];
}

export interface ExecOrgMonthly {
  org: string;
  region: string;
  budget: number;
  executed: number;
  programs: number;
  /** months 배열과 같은 순서로, 그 달에 나간 돈. */
  months: number[];
}

export interface ExecObjectGroup {
  key: string;
  label: string;
  gloss: string;
  amount: number;
  count: number;
  /** months 배열과 같은 순서. */
  months: number[];
}

/**
 * 위탁 집행 ↔ 계약현황. 이름을 메우려다 못 메운 자리를 수치로 들고 있는 자료다.
 * scripts/build_vendors.py 참고.
 */
export interface VendorData {
  meta: {
    source: string;
    entrusted: number;
    entrustedPublic: number;
    entrustedPrivate: number;
    contractTotal: number;
    contractCount: number;
    operTotal: number;
    operCount: number;
    buildTotal: number;
    etcTotal: number;
    /** 위탁 집행 가운데 계약으로 이름이 드러나는 비율. */
    coverage: number;
    orgsWithEntrust: number;
    orgsWithOper: number;
    orgsBoth: number;
    /** 법인격 표기가 없어 표에서 뺀 상호. 개인사업자일 수 있다. */
    unnamed: { amount: number; count: number };
  };
  vendors: {
    vendor: string;
    amount: number;
    count: number;
    orgs: string[];
    orgCount: number;
  }[];
  blind: {
    org: string;
    entrusted: number;
    public: number;
    contracts: number;
  }[];
}
