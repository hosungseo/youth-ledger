/**
 * 사이트의 계층은 세 단이다.
 *
 *   청년대장            ← 뿌리. 두 장부를 견주는 곳
 *     └ 기준            ← 온통청년 / 재정. 여기서 갈리면 끝까지 갈린 채로 간다
 *         └ 페이지      ← 판 · 목록 · 유형 · 부문 · 집행
 *             └ 낱장    ← 지역, 사업 상세
 *
 * 이 파일이 그 단을 한 곳에 적어 둔다. 헤더·꼬리말·경로별 레이아웃이 각자
 * 목록을 들고 있으면 하나를 고칠 때 나머지가 조용히 어긋난다.
 */
export type Basis = "notice" | "fiscal";

export interface BasisDef {
  key: Basis;
  /** 헤더 토글에 서는 짧은 이름. */
  label: string;
  /** 이 장부가 무엇을 세는지 — 토글 밑 한 줄. */
  gloss: string;
  home: string;
  pages: { href: string; label: string; hint: string }[];
}

export const BASES: Record<Basis, BasisDef> = {
  notice: {
    key: "notice",
    label: "온통청년 기준",
    gloss: "기관이 등록한 청년정책",
    home: "/notice/plate",
    pages: [
      { href: "/notice/plate", label: "판", hint: "지역 × 분야 한 장" },
      { href: "/notice/list", label: "목록", hint: "좁혀서 찾기" },
      { href: "/notice/types", label: "분야", hint: "여덟 갈래" },
    ],
  },
  fiscal: {
    key: "fiscal",
    label: "재정 기준",
    gloss: "예산서에 잡힌 청년 세부사업",
    home: "/fiscal/plate",
    pages: [
      { href: "/fiscal/plate", label: "판", hint: "지역 × 분야 한 장" },
      { href: "/fiscal/list", label: "목록", hint: "좁혀서 찾기" },
      { href: "/fiscal/sectors", label: "부문", hint: "예산서의 칸" },
      { href: "/fiscal/exec", label: "집행", hint: "날짜별로 나간 돈" },
    ],
  },
};

export const BASIS_LIST = [BASES.notice, BASES.fiscal];

export function basisOf(pathname: string): Basis | null {
  if (pathname.startsWith("/fiscal")) return "fiscal";
  if (pathname.startsWith("/notice")) return "notice";
  return null;
}

/**
 * 기준을 바꿀 때 갈 곳.
 *
 * 판·목록·지역은 양쪽에 같은 이름으로 있으니 보던 자리를 그대로 지킨다.
 * 유형(공고에만)·부문·집행(재정에만)처럼 짝이 없는 페이지에서는 상대 기준의
 * 판으로 보낸다 — 없는 페이지로 보내 404를 내는 것보다 낫다.
 */
export function counterpart(pathname: string, to: Basis): string {
  const rest = pathname.replace(/^\/(notice|fiscal)/, "");
  // 중앙은 예외다. 공고 기준에는 중앙부처를 한 장으로 묶은 지역 페이지가 있지만
  // 재정 기준의 중앙은 부처별로만 뜻이 있어 그런 장을 만들지 않았다.
  const shared =
    rest === "/plate" ||
    rest === "/list" ||
    (rest.startsWith("/region/") && rest !== "/region/central");
  return shared ? `/${to}${rest}` : BASES[to].home;
}
