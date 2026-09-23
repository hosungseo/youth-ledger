/**
 * One hue per 청년정책 분야 — the site's primary wayfinding device.
 *
 * 값이 hex가 아니라 var()인 것은, 같은 주황이라도 흰 바탕과 검은 바탕에서
 * 읽히는 톤이 다르기 때문이다. 실제 색은 globals.css의 [data-basis]가 정한다.
 */
export interface TypeStyle {
  key: string;
  label: string;
  short: string;
  tile: string;   // pastel tile behind the icon
  fg: string;     // saturated mark / text
  ring: string;   // hairline at the same hue
  fill: string;   // map + chart fill
  hot: string;    // 판의 칸이 가장 진해지는 끝 — globals.css 주석 참고
}

/** globals.css가 유형마다 tile·fg·ring 세 벌을 들고 있고, fill은 공용 토큰이다. */
const hues = (name: string, fillVar: string) => ({
  tile: `var(--color-${name}-tile)`,
  fg: `var(--color-${name}-fg)`,
  ring: `var(--color-${name}-ring)`,
  fill: `var(${fillVar})`,
  hot: `var(--color-${name}-hot)`,
});

export const TYPE_STYLES: TypeStyle[] = [
  { key: "취업·일경험", label: "취업·일경험", short: "취업", ...hues("biz", "--color-t-biz") },
  { key: "창업·농어업", label: "창업·농어업", short: "창업·농어", ...hues("people", "--color-t-people") },
  { key: "주거", label: "주거", short: "주거", ...hues("space", "--color-t-space") },
  { key: "교육·역량", label: "교육·역량", short: "교육", ...hues("mentor", "--color-t-mentor") },
  { key: "금융·생활안정", label: "금융·생활안정", short: "금융·생활", ...hues("loan", "--color-t-loan") },
  { key: "문화·건강", label: "문화·건강", short: "문화·건강", ...hues("event", "--color-t-event") },
  { key: "참여·권리", label: "참여·권리", short: "참여", ...hues("global", "--color-t-global") },
  { key: "정책기반", label: "정책기반(공간·운영)", short: "기반", ...hues("rnd", "--color-t-rnd") },
];

const FALLBACK: TypeStyle = {
  key: "기타", label: "기타", short: "기타",
  tile: "var(--color-etc-tile)", fg: "var(--color-etc-fg)",
  ring: "var(--color-etc-ring)", fill: "var(--color-etc-fill)",
  hot: "var(--color-etc-hot)",
};

const BY_KEY = new Map(TYPE_STYLES.map((t) => [t.key, t]));

export function typeStyle(key: string | undefined): TypeStyle {
  return (key && BY_KEY.get(key)) || FALLBACK;
}

/** 억원 → a compact Korean reading. 34719 → "3조 4,719억" */
export function formatBudget(eok: number | null | undefined): string {
  if (eok == null) return "미정";
  if (eok >= 10000) {
    const jo = Math.floor(eok / 10000);
    const rest = Math.round(eok % 10000);
    return rest ? `${jo}조 ${rest.toLocaleString("ko-KR")}억` : `${jo}조원`;
  }
  if (eok >= 1) return `${Math.round(eok).toLocaleString("ko-KR")}억`;
  if (eok <= 0) return "0";
  return `${Math.round(eok * 100)}백만`;
}

export function formatWhen(when: { months: number[]; always: boolean; raw: string }): string {
  if (when.always) return "연중 상시";
  if (!when.months.length) return when.raw || "시기 미정";
  if (when.months.length === 1) return `${when.months[0]}월`;
  return `${when.months[0]}~${when.months[when.months.length - 1]}월`;
}

/** 시도 short name → the region page slug (ASCII, stable in URLs). */
export const REGION_SLUG: Record<string, string> = {
  중앙: "central", 서울: "seoul", 부산: "busan", 대구: "daegu", 인천: "incheon",
  광주: "gwangju", 대전: "daejeon", 울산: "ulsan", 세종: "sejong", 경기: "gyeonggi",
  강원: "gangwon", 충북: "chungbuk", 충남: "chungnam", 전북: "jeonbuk",
  전남: "jeonnam", 경북: "gyeongbuk", 경남: "gyeongnam", 제주: "jeju",
};

export const SLUG_REGION: Record<string, string> = Object.fromEntries(
  Object.entries(REGION_SLUG).map(([k, v]) => [v, k]),
);

/** Full formal names, for headings and <title>. */
export const REGION_FULL: Record<string, string> = {
  중앙: "중앙부처", 서울: "서울특별시", 부산: "부산광역시", 대구: "대구광역시",
  인천: "인천광역시", 광주: "광주광역시", 대전: "대전광역시", 울산: "울산광역시",
  세종: "세종특별자치시", 경기: "경기도", 강원: "강원특별자치도", 충북: "충청북도",
  충남: "충청남도", 전북: "전북특별자치도", 전남: "전라남도", 경북: "경상북도",
  경남: "경상남도", 제주: "제주특별자치도",
};

/**
 * Korean particle selection. The right form depends on whether the preceding
 * syllable ends in a consonant, so it cannot be hard-coded next to a name that
 * varies ("서울특별시와" but "부산광역시와", "경기도와"; "인천광역시은" is wrong).
 */
export function josa(
  word: string,
  pair: "와과" | "은는" | "이가" | "을를" | "으로로",
): string {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const final = isHangul ? (code - 0xac00) % 28 : 0;
  const hasFinal = final !== 0;

  // '으로/로'만 규칙이 다르다. 받침이 없을 때뿐 아니라 ㄹ 받침에서도 '로'다
  // ("서울로", "나주시로" / "대전본청으로", "군위군으로").
  if (pair === "으로로") return !hasFinal || final === 8 ? "로" : "으로";

  const [withFinal, without] = {
    와과: ["과", "와"],
    은는: ["은", "는"],
    이가: ["이", "가"],
    을를: ["을", "를"],
  }[pair];
  return hasFinal ? withFinal : without;
}
