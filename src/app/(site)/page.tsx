import Link from "next/link";
import { fiscal, fiscalPrograms, getRecord, link, meta, programs } from "@/lib/data";
import { formatBudget, typeStyle } from "@/lib/design";
import type { PolicyRecord, Program } from "@/lib/types";
import SearchDialog from "@/components/SearchDialog";

// 설명에 숫자를 손으로 적어 두면 자료가 바뀔 때마다 조용히 틀린다.
// (1,519건으로 박혀 있던 것이 공개된 뒤에야 드러났다.)
export const metadata = {
  title: { absolute: "청년대장 — 범정부 청년정책 인벤토리 시제품" },
  description:
    `온통청년 청년정책 ${meta.total.toLocaleString("ko-KR")}건, 예산서의 청년 세부사업 ${fiscal.meta.total.toLocaleString("ko-KR")}건, ` +
    "보조금24 서비스를 번호로 이어 본 범정부 청년정책 목록의 시제품입니다.",
};

const n = (v: number) => v.toLocaleString("ko-KR");
const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;

/** The policy that shows every link at once: 보조금24(높음) + a strict budget line + open, preferring one with other registrations. */
type Linked = { p: Program; r: PolicyRecord };
function pickExample(): Linked | undefined {
  return programs
    .map((p) => ({ p, r: getRecord(p.id) }))
    .filter((x): x is Linked => !!x.r)
    .filter(({ p, r }) => p.gov24?.conf === "높음" && r.budget.some((b) => b.strict) && (p.status === "상시" || p.status === "진행중"))
    .sort((a, b) => b.r.same.length - a.r.same.length || (b.p.budget ?? 0) - (a.p.budget ?? 0))[0];
}

export default function Home() {
  const est = fiscal.meta.absentEstimate;
  const support = est?.byKind?.["대상자 지원"];
  const g24 = link.gov24Absence;
  const cp = link.coveragePolicy;
  const ex = pickExample();
  const localNotice = programs.filter((p) => p.section === "local").length;
  const localFiscal = fiscalPrograms.filter((p) => p.level === "local");

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 md:px-8">
      <p className="text-[12.5px] font-semibold text-ink-3">범정부 청년정책 인벤토리 · 시제품</p>
      <h1 className="mt-3 max-w-[820px] text-[36px] leading-[1.15] font-bold tracking-[-0.035em] text-balance md:text-[52px]">
        청년정책을
        <br />
        한 목록으로.
      </h1>
      <p className="mt-6 max-w-[680px] text-[15.5px] leading-[1.85] text-ink-2">
        청년정책은 지금 세 곳에 따로 있습니다. 정책 안내는 <b className="font-semibold text-ink">온통청년</b>, 자격과 신청은{" "}
        <b className="font-semibold text-ink">보조금24</b>, 예산과 집행은 <b className="font-semibold text-ink">지방재정365·열린재정</b>.
        서로 가리키는 번호가 없어 한 정책의 조건과 돈을 한 번에 볼 수 없습니다. 이 시제품은 공개 자료만으로 셋을 이어, 청년정책 전담조직이 쓸
        범정부 목록이 어떤 모습일지 먼저 만들어 본 것입니다.
      </p>

      <div className="mt-8 max-w-[720px]">
        <SearchDialog hero />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/find" className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-onink transition-opacity hover:opacity-90">
          내 조건으로 찾기 →
        </Link>
        <Link href="/notice/list" className="rounded-full border border-hair bg-card px-5 py-2.5 text-[14px] font-semibold text-ink-2 hover:bg-wash">
          정책 목록
        </Link>
        <Link href="/fiscal/list" className="rounded-full border border-hair bg-card px-5 py-2.5 text-[14px] font-semibold text-ink-2 hover:bg-wash">
          예산서 세부사업
        </Link>
      </div>

      {/* what the linking shows, in four numbers */}
      <section className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="주요 수치">
        <Stat href="/notice/list" value={`${n(meta.total)}건`} label="온통청년 청년정책" note={`지금 신청 가능 ${n(meta.open ?? 0)}건 · 중앙 ${n(meta.central)} · 지자체 ${n(meta.local)}`} />
        <Stat
          href="/fiscal/list"
          value={`${n(fiscal.meta.total)}개`}
          label="예산서의 청년 세부사업"
          note={`예산현액 ${formatBudget(fiscal.meta.budgetTotal)}원 · 이름에 ‘청년’ 등이 들어간 사업`}
        />
        <Stat
          href="/fiscal/list?onthong=absent"
          value={support ? `약 ${Math.round(support.share)}%` : "—"}
          label="온통청년에서 확인되지 않는 대상자 지원 사업"
          note={support ? `지방 대상자 지원형 세부사업 기준 · 표본 추정(95% 구간 ${Math.round(support.ci[0])}~${Math.round(support.ci[1])}%)` : ""}
        />
        <Stat
          href="/link"
          value={pct(cp.both, cp.total)}
          label="보조금24·예산 둘 다 이어지는 정책"
          note={`${n(cp.both)}건뿐 · 공통 번호가 없어 이름으로 대조한 결과${g24 ? ` · 보조금24 청년 서비스 약 ${n(g24.absentYouthN)}건은 온통청년에 없음` : ""}`}
        />
      </section>

      {/* one policy, all the links — what the inventory would show for every policy */}
      {ex && (
        <section className="mt-14">
          <h2 className="text-[22px] font-bold tracking-[-0.025em]">한 정책이 이어지면</h2>
          <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
            세 곳이 모두 이어지는 드문 정책 하나입니다. 인벤토리는 모든 정책을 이렇게 보여 주려는 것입니다 — 온통청년의 안내, 보조금24의 자격과 신청,
            예산서의 돈이 한 줄로.
          </p>
          <ExampleChain ex={ex} />
        </section>
      )}

      {/* what you can do here */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">여기서 할 수 있는 것</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Task href="/find" title="내 조건으로 찾기" body="사는 곳·나이·소득·상태를 넣으면 온통청년·보조금24·예산서에서 해당하는 것을 한 번에 봅니다." cta="찾아보기" />
          <Task href="/link" title="종합 지도" body="시·군·구별 청년 1인당 예산, 온통청년에 없는 사업의 비율, 청년 나이 상한을 지도로 봅니다." cta="지도 보기" />
          <Task href="/quality" title="점검" body="온통청년 자료를 그대로 세어, 등록 시기·회차·항목에서 어떤 기준이 필요한지 봅니다." cta="점검 보기" />
          <Task href="/proposal" title="제안" body="새 시스템 없이 시행계획·온통청년·보조금24·재정정보를 정책 ID 하나로 잇는 구상입니다." cta="제안 보기" />
        </div>
      </section>

      {/* the two ledgers, side by side */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">두 장부로 들어가기</h2>
        <p className="mt-2 max-w-[700px] text-[14px] leading-[1.8] text-ink-2">
          온통청년은 기관이 등록한 정책을, 재정 기준은 예산서에 잡힌 청년 세부사업을 셉니다. 들어가면 바탕색이 바뀝니다 — 흰 바탕은 온통청년, 검은 바탕은 예산입니다.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Door
            href="/notice/plate"
            eyebrow="온통청년 기준"
            count={meta.total}
            unit="건 청년정책"
            sub={`지금 신청 가능 ${n(meta.open ?? 0)}건 · 보조금24 연결 ${n(meta.withGov24 ?? 0)}건`}
            bullets={["지역·분야·신청시기로 좁히기", "정책마다 인벤토리 카드(번호·자격·예산)", "같은 사업의 다른 등록까지"]}
            tone="paper"
          />
          <Door
            href="/fiscal/plate"
            eyebrow="재정 기준"
            count={fiscal.meta.total}
            unit="개 청년 세부사업"
            sub={`예산현액 ${formatBudget(fiscal.meta.budgetTotal)}원 · 온통청년 대응 ${n(fiscal.meta.inOnthong ?? 0)}개(자동 판정)`}
            bullets={["온통청년에 없는 사업 걸러 보기", "세부사업마다 2026년 집행 추이와 재원", "분야·지역·부문별로 갈라 보기"]}
            tone="ink"
          />
        </div>
        <p className="mt-4 max-w-[760px] text-[12.5px] leading-[1.7] text-ink-3">
          지자체만 견주면 온통청년에 등록된 정책은 {n(localNotice)}건, 예산서의 청년 세부사업은 {n(localFiscal.length)}개입니다. 한 정책이 광역·시군 예산으로 나뉘어
          여러 세부사업이 되기도 해서 건수 차이가 곧 누락은 아닙니다
          {est ? ` — 실제로 온통청년에 대응 정책이 없는 비율은 표본 검토로 약 ${Math.round(est.absentShare)}%(대상자 지원형 약 ${Math.round(support?.share ?? 0)}%)로 추정했습니다` : ""}.
        </p>
      </section>

      <p className="mt-16 border-t border-hair pt-6 text-[12px] leading-[1.8] text-ink-3">
        출처 · {meta.source} · {fiscal.meta.source} · 보조금24(공공데이터포털) · KOSIS 주민등록인구. 비공식 개념검증이며 기관의 공식 입장이 아닙니다.
        수치의 한계와 정확도는{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-ink">
          자료
        </Link>
        에 적어 두었습니다.
      </p>
    </div>
  );
}

function ExampleChain({ ex }: { ex: Linked }) {
  const { p, r } = ex;
  const s = typeStyle(p.type);
  const b = [...r.budget].sort((x, y) => Number(y.strict) - Number(x.strict) || y.budget - x.budget)[0];
  const rate = b && b.budget > 0 ? Math.round((b.executed / b.budget) * 100) : 0;
  const g = r.gov24;
  const age = (a: [number | null, number | null]) => (a[0] == null && a[1] == null ? "제한 없음" : `${a[0] ?? ""}~${a[1] ?? ""}세`);
  const cells = [
    {
      tag: "온통청년 · 안내",
      title: p.name,
      lines: [`${p.agency} · ${p.status}`, r.plan.cycle ? `기본계획 과제 ${r.plan.cycle}차 ${r.plan.way}-${r.plan.focus}-${r.plan.task}` : "", r.same.length ? `같은 사업의 다른 등록 ${r.same.length}건` : ""],
    },
    {
      tag: "보조금24 · 자격과 신청",
      title: p.gov24?.name ?? "",
      lines: [`서비스ID ${p.gov24?.id}`, g ? `나이 ${age(g.age)} · 소득 ${g.income}` : "", g?.kind ? `지원유형 ${g.kind}` : ""],
    },
    {
      tag: "예산서 · 돈",
      title: b?.name ?? "",
      lines: [b ? `${b.org} · 예산현액 ${formatBudget(b.budget)}원` : "", b ? `집행 ${formatBudget(b.executed)}원 (${rate}%)` : ""],
    },
  ];
  return (
    <Link href={`/notice/program/${p.id}`} className="group mt-5 block rounded-[20px] border border-hair bg-card p-5 transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] md:p-6">
      <ol className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        {cells.map((c, i) => (
          <li key={c.tag} className="contents">
            {i > 0 && (
              <span className="hidden self-center text-[20px] text-ink-3 md:block" aria-hidden>
                ↔
              </span>
            )}
            <div className="min-w-0 rounded-[14px] bg-wash-0 p-4">
              <p className="text-[11.5px] font-semibold" style={{ color: i === 0 ? s.fg : undefined }}>
                <span className={i === 0 ? "" : "text-ink-3"}>{c.tag}</span>
              </p>
              <p className="mt-1.5 text-[15px] leading-snug font-bold">{c.title}</p>
              <ul className="mt-2 space-y-0.5 text-[12px] text-ink-2">
                {c.lines.filter(Boolean).map((l) => (
                  <li key={l} className="tnum">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-[13px] font-semibold">
        이 정책의 인벤토리 카드 보기 <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </p>
    </Link>
  );
}

function Stat({ href, value, label, note }: { href: string; value: string; label: string; note: string }) {
  return (
    <Link href={href} className="group rounded-[16px] border border-hair bg-card p-5 transition-shadow hover:shadow-[0_6px_22px_rgba(0,0,0,0.07)]">
      <p className="tnum text-[30px] leading-none font-bold tracking-[-0.03em]">{value}</p>
      <p className="mt-2 text-[13px] font-semibold group-hover:underline">{label}</p>
      <p className="mt-1 text-[11.5px] leading-[1.55] text-ink-3">{note}</p>
    </Link>
  );
}

function Task({ href, title, body, cta }: { href: string; title: string; body: string; cta: string }) {
  return (
    <Link href={href} className="group flex flex-col justify-between rounded-[18px] border border-hair bg-card p-5 transition-shadow hover:shadow-[0_6px_22px_rgba(0,0,0,0.07)]">
      <span>
        <span className="block text-[16px] font-bold tracking-[-0.02em]">{title}</span>
        <span className="mt-2 block text-[13px] leading-[1.7] text-ink-2">{body}</span>
      </span>
      <span className="mt-5 text-[13px] font-semibold">
        {cta} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </span>
    </Link>
  );
}

function Door({
  href,
  eyebrow,
  count,
  unit,
  sub,
  bullets,
  tone,
}: {
  href: string;
  eyebrow: string;
  count: number;
  unit: string;
  sub: string;
  bullets: string[];
  tone: "paper" | "ink";
}) {
  // 홈은 늘 밝은 바탕이므로 검은 문짝은 토큰이 아니라 제 색을 직접 든다.
  const ink = tone === "ink";
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-[20px] border p-7 transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)] ${
        ink ? "border-[#0e0f12] bg-[#0e0f12] text-white" : "border-hair bg-card"
      }`}
    >
      <div>
        <span className={`text-[12px] font-semibold ${ink ? "text-white/55" : "text-ink-3"}`}>{eyebrow}</span>
        <p className="tnum mt-3 text-[40px] leading-none font-bold tracking-[-0.03em]">
          {count.toLocaleString("ko-KR")}
          <span className={`ml-1.5 text-[15px] font-semibold ${ink ? "text-white/70" : "text-ink-2"}`}>{unit}</span>
        </p>
        <p className={`tnum mt-2 text-[13px] ${ink ? "text-white/60" : "text-ink-3"}`}>{sub}</p>
        <ul className="mt-5 space-y-1.5">
          {bullets.map((b) => (
            <li key={b} className={`flex gap-2.5 text-[12.5px] ${ink ? "text-white/75" : "text-ink-2"}`}>
              <span className={`mt-[7px] h-1 w-1 shrink-0 rounded-full ${ink ? "bg-t-biz" : "bg-ink"}`} aria-hidden />
              {b}
            </li>
          ))}
        </ul>
      </div>
      <span className={`mt-8 inline-flex items-center gap-2 text-[14px] font-semibold ${ink ? "text-t-biz" : "text-ink"}`}>
        이 기준으로 들어가기
        <span className="transition-transform group-hover:translate-x-1" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
