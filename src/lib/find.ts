/**
 * '내 조건으로 찾기' — one person's conditions against three ledgers.
 * Data: public/data/find.json (scripts/16_build_find.py). Pure functions only, so the rules are testable.
 */

export type Status = "" | "미취업" | "재직" | "창업" | "대학생" | "농어업";

export interface Person {
  place: string; // laf code
  sido: string;
  age: number;
  /** 중위소득 구간 index: 0 ≤50%, 1 ≤75%, 2 ≤100%, 3 ≤200%, 4 >200%; null = 모름 */
  income: number | null;
  status: Status;
  single: boolean; // 1인가구
  noHouse: boolean; // 무주택
  married: boolean; // 기혼
}

export interface OnthongItem {
  id: string; n: string; t: string; inst: string; r: string[]; a0: number; a1: number;
  e: 0 | 1 | 2; emp: string[]; edu: string[]; spc: string[]; mrg: "" | "기혼" | "미혼"; s: string; g: string | null; page: boolean;
}
export interface Gov24Item {
  id: string; n: string; inst: string; f: string; k: string; r: string; a0: number; a1: number;
  inc: number[]; tr: string[]; trNone: boolean; hh: string[]; hhNone: boolean; y: boolean; sum?: string; tg?: string;
}
export interface BudgetItem { n: string; r: string | null; org: string; b: number; ep: number }
export interface Place { code: string; sido: string; name: string }

export interface FindData {
  asof: string;
  places: Place[];
  onthong: OnthongItem[];
  gov24: Gov24Item[];
  budgetOnly: BudgetItem[];
  traits: Record<string, string[]>;
  emp: Record<string, string[]>;
}

export type Verdict = { ok: true; check: string[] } | { ok: false };

const inRegion = (token: string, p: Person) => token === "ALL" || token === `S:${p.sido}` || token === p.place;

/** 온통청년: exclude only on clear mismatch; unknowable conditions become "확인 필요" notes. */
export function judgeOnthong(o: OnthongItem, p: Person, emp: Record<string, string[]>): Verdict {
  if (!o.r.some((t) => inRegion(t, p))) return { ok: false };
  if (p.age < o.a0 || p.age > o.a1) return { ok: false };
  if (o.mrg === "기혼" && !p.married) return { ok: false };
  if (o.mrg === "미혼" && p.married) return { ok: false };
  const check: string[] = [];
  if (o.emp.length) {
    const mine = p.status ? emp[p.status] ?? [] : [];
    if (o.emp.some((x) => mine.includes(x))) {
      /* matches */
    } else if (!p.status || o.emp.includes("기타")) check.push(`취업상태(${o.emp.join("·")})`);
    else return { ok: false };
  }
  if (o.edu.length) {
    const student = p.status === "대학생" && o.edu.some((x) => /대학 재학|대졸 예정/.test(x));
    if (!student) check.push(`학력(${o.edu.join("·")})`);
  }
  if (o.spc.length) {
    const farm = p.status === "농어업" && o.spc.includes("농업인");
    if (!farm) check.push(`대상(${o.spc.join("·")})`);
  }
  if (o.e === 1) check.push("연소득 기준");
  if (o.e === 2) check.push("소득 기준(문구)");
  return { ok: true, check };
}

/** 보조금24: its conditions are coded, so most mismatches are decidable. */
export function judgeGov24(g: Gov24Item, p: Person, traits: Record<string, string[]>): Verdict {
  if (!inRegion(g.r, p)) return { ok: false };
  if (p.age < g.a0 || p.age > g.a1) return { ok: false };
  const check: string[] = [];
  if (g.tg) check.push(`대상(${g.tg})`);
  if (g.inc.length) {
    if (p.income == null) check.push("소득 구간");
    else if (!g.inc.includes(p.income)) return { ok: false };
  }
  if (g.tr.length && !g.trNone) {
    const mine = p.status ? traits[p.status] ?? [] : [];
    if (!g.tr.some((t) => mine.includes(t))) return { ok: false };
  }
  if (g.hh.length && !g.hhNone) {
    const mine = [...(p.single ? ["JA0404"] : []), ...(p.noHouse ? ["JA0412"] : [])];
    if (!g.hh.some((h) => mine.includes(h))) return { ok: false };
  }
  return { ok: true, check };
}

export interface Result {
  onthong: { item: OnthongItem; check: string[] }[];
  gov24: { item: Gov24Item; check: string[] }[];
  budget: BudgetItem[];
  /** 온통청년 policies whose linked 보조금24 service also qualifies */
  both: Set<string>;
}

export function findFor(d: FindData, p: Person): Result {
  const onthong: Result["onthong"] = [];
  for (const o of d.onthong) {
    const v = judgeOnthong(o, p, d.emp);
    if (v.ok) onthong.push({ item: o, check: v.check });
  }
  const gov24: Result["gov24"] = [];
  for (const g of d.gov24) {
    const v = judgeGov24(g, p, d.traits);
    if (v.ok) gov24.push({ item: g, check: v.check });
  }
  // clear matches first, then local before nationwide
  const localFirst = (r: string[] | string) => ((Array.isArray(r) ? r.includes("ALL") : r === "ALL") ? 1 : 0);
  onthong.sort((a, b) => a.check.length - b.check.length || localFirst(a.item.r) - localFirst(b.item.r));
  gov24.sort((a, b) => a.check.length - b.check.length || localFirst(a.item.r) - localFirst(b.item.r));
  const gIds = new Set(gov24.map((x) => x.item.id));
  const both = new Set(onthong.filter((x) => x.item.g && gIds.has(x.item.g)).map((x) => x.item.id));
  const budget = d.budgetOnly.filter((b) => b.r && inRegion(b.r, p)).sort((a, b) => b.b - a.b);
  return { onthong, gov24, budget, both };
}

/** Compact counts for the "같은 사람, 다른 동네" comparison. */
export function countFor(d: FindData, p: Person, open: boolean, youthOnly: boolean) {
  let on = 0;
  let g = 0;
  for (const o of d.onthong) {
    if (open && !(o.s === "상시" || o.s === "진행중")) continue;
    const v = judgeOnthong(o, p, d.emp);
    if (v.ok && v.check.length === 0) on++;
  }
  for (const x of d.gov24) {
    if (youthOnly && !x.y) continue;
    const v = judgeGov24(x, p, d.traits);
    if (v.ok && v.check.length === 0) g++;
  }
  return { on, g };
}

export const INCOME_LABELS = ["중위소득 50% 이하", "51~75%", "76~100%", "101~200%", "200% 초과"];
