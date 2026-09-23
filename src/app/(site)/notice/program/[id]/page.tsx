import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProgram, getRecord, programs } from "@/lib/data";
import { REGION_FULL, REGION_SLUG, formatBudget, typeStyle } from "@/lib/design";
import type { PolicyRecord, Program } from "@/lib/types";
import Crumbs from "@/components/Crumbs";

export function generateStaticParams() {
  return programs.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = getProgram((await params).id);
  if (!p) return { title: "찾을 수 없는 정책" };
  return { title: p.name, description: p.summary || `${p.agency}의 ${p.type} 청년정책.` };
}

const dot = (d: string | null | undefined) => (d ? d.replaceAll("-", ". ") + "." : "");
function ageText([lo, hi]: [number | null, number | null]) {
  if (lo == null && hi == null) return "제한 없음";
  if (lo == null) return `${hi}세 이하`;
  if (hi == null) return `${lo}세 이상`;
  return `${lo}~${hi}세`;
}

type SlotState = "filled" | "auto" | "none" | "proposed";

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  const p = getProgram(id);
  const r = getRecord(id);
  if (!p || !r) notFound();

  const s = typeStyle(p.type);
  const regionLabel = REGION_FULL[p.region] ?? p.region;
  const open = p.status === "상시" || p.status === "진행중";
  const period = r.apply.begin || r.apply.end ? `${dot(r.apply.begin)} ~ ${dot(r.apply.end)}` : p.status === "상시" ? "연중 상시" : "기간 미기재";
  const g = r.gov24;

  const slots: { label: string; value: string; note: string; state: SlotState }[] = [
    { label: "정책 ID", value: "없음", note: `지금은 등록 건마다 새 번호(${id.slice(-6)})`, state: "proposed" },
    {
      label: "회차",
      value: r.same.length ? `${r.same.length + 1}건으로 등록` : "한 건",
      note: r.same.length ? "같은 사업을 해마다·지역마다 따로 등록" : "같은 이름의 다른 등록 없음",
      state: r.same.length ? "auto" : "filled",
    },
    {
      label: "기본계획 과제번호",
      value: r.plan.cycle ? `${r.plan.cycle}차 ${r.plan.way}-${r.plan.focus}-${r.plan.task}` : "—",
      note: r.plan.cycle === 1 ? "1차 계획 과제(지난 계획)" : "온통청년에 기재",
      state: r.plan.cycle ? "filled" : "none",
    },
    {
      label: "보조금24 서비스ID",
      value: p.gov24 ? p.gov24.id : "없음",
      note: p.gov24 ? (g?.direct ? "온통청년 링크에 기재" : `이름 대조로 찾음 · 신뢰도 ${p.gov24.conf}`) : "대응 서비스를 찾지 못함",
      state: p.gov24 ? (g?.direct ? "filled" : "auto") : "none",
    },
    {
      label: "재정사업 코드",
      value: r.budget.length ? `세부사업 ${r.budget.length}개` : "없음",
      note: r.budget.length ? "이름·지역 대조로 찾음" : "이어지는 예산서 사업을 찾지 못함",
      state: r.budget.length ? "auto" : "none",
    },
  ];

  const nearby = programs
    .filter((q) => q.id !== p.id && q.region === p.region && q.type === p.type)
    .sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || (b.budget ?? 0) - (a.budget ?? 0))
    .slice(0, 6);

  return (
    <article className="mx-auto max-w-[1180px] px-5 py-10 md:px-8">
      <Crumbs
        basis="notice"
        trail={[
          { href: "/notice/plate", label: "판" },
          { href: `/notice/region/${REGION_SLUG[p.region]}`, label: regionLabel },
          { href: `/notice/list?type=${encodeURIComponent(p.type)}`, label: p.type },
        ]}
        here={p.name}
      />

      <div className="mt-4 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] lg:gap-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <Link href={`/notice/list?type=${encodeURIComponent(p.type)}`} className="inline-flex items-center gap-1.5 font-semibold" style={{ color: s.fg }}>
              <span className="h-2 w-2" style={{ background: s.fill }} aria-hidden />
              {p.type}
            </Link>
            <span className="text-ink-3">·</span>
            <Link href={`/notice/region/${REGION_SLUG[p.region]}`} className="text-ink-2 hover:text-ink">
              {p.section === "central" ? "중앙부처" : regionLabel}
            </Link>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${open ? "bg-ink text-onink" : "bg-wash text-ink-2"}`}>{p.status ?? "상태 미상"}</span>
          </div>

          <h1 className="mt-3 text-[30px] leading-[1.22] font-bold tracking-[-0.03em] text-balance md:text-[40px]">{p.name}</h1>
          {p.summary && <p className="mt-4 max-w-[640px] text-[15.5px] leading-[1.8] text-ink-2">{p.summary}</p>}

          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-hair pt-6 md:grid-cols-4">
            <Fact k="신청 기간" v={period} />
            <Fact k="대상 지역" v={r.areas.label} />
            <Fact k="지원 규모" v={r.scale.count ? `${r.scale.count.toLocaleString("ko-KR")}명(건)` : r.scale.limited ? "제한 있음 · 인원 미기재" : "제한 없음"} />
            <Fact k="연결 예산" v={p.budget != null ? `${formatBudget(p.budget)}원` : "연결 없음"} />
          </dl>

          {/* the inventory card: which of the five numbers this policy already carries */}
          <section className="mt-10 rounded-[20px] border border-hair bg-card p-5 md:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[16px] font-bold tracking-[-0.02em]">이 정책을 잇는 번호</h2>
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-ink-3">
                <Legend state="filled" t="온통청년에 기재" />
                <Legend state="auto" t="이 시제품이 자동 대조" />
                <Legend state="none" t="없음" />
                <Legend state="proposed" t="인벤토리에서 새로 부여" />
              </p>
            </div>
            <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {slots.map((x) => (
                <li key={x.label} className={`rounded-[14px] border p-3.5 ${x.state === "none" ? "border-dashed border-hair" : "border-hair"} ${x.state === "filled" ? "bg-wash-0" : ""}`}>
                  <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-3">
                    <Mark state={x.state} />
                    {x.label}
                  </p>
                  <p className={`tnum mt-1.5 font-bold break-all ${x.value.length > 10 ? "text-[12.5px]" : "text-[14.5px]"} ${x.state === "none" || x.state === "proposed" ? "text-ink-3" : ""}`}>{x.value}</p>
                  <p className="mt-1 text-[11.5px] leading-[1.5] text-ink-3">{x.note}</p>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[11.5px] leading-[1.6] text-ink-3">
              다섯 번호가 모두 붙으면 이 정책의 자격(보조금24)·예산과 집행(재정)·기본계획 과제가 따로 찾지 않아도 한 줄로 이어집니다.{" "}
              <Link href="/proposal" className="underline underline-offset-2 hover:text-ink">번호 체계</Link>
            </p>
          </section>

          {(p.note || r.classification.length > 0) && (
            <section className="mt-10">
              <H2>지원 내용</H2>
              {p.note && <p className="mt-2 max-w-[680px] text-[14.5px] leading-[1.8] text-ink-2">{p.note}</p>}
              {r.classification.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1.5">
                  {r.classification.map((c) => (
                    <span key={c} className="rounded-full bg-wash px-2.5 py-1 text-[11.5px] text-ink-2">{c}</span>
                  ))}
                </p>
              )}
            </section>
          )}

          <Conditions r={r} />

          {(r.how || r.screening || r.documents) && (
            <section className="mt-10">
              <H2>신청</H2>
              <dl className="mt-3 space-y-3 text-[14px] leading-[1.75]">
                {r.how && <Row k="신청 방법" v={r.how} />}
                {r.screening && <Row k="심사·선정" v={r.screening} />}
                {r.documents && <Row k="제출 서류" v={r.documents} />}
                {g && (g.method || g.deadline) && <Row k="보조금24 안내" v={[g.deadline && `신청기한 ${g.deadline}`, g.method].filter(Boolean).join(" · ")} />}
              </dl>
            </section>
          )}

          <section className="mt-10">
            <H2>예산서의 세부사업</H2>
            {r.budget.length ? (
              <>
                <p className="mt-1.5 text-[12.5px] text-ink-3">이름·지역으로 자동 대조한 결과입니다. 한 정책이 광역·시군 예산으로 나뉘어 여러 세부사업에 걸치기도 합니다.</p>
                <ul className="mt-3 border-t border-hair">
                  {r.budget.map((b) => {
                    const rate = b.budget > 0 ? Math.min(1, b.executed / b.budget) : 0;
                    return (
                      <li key={b.id}>
                        <Link href={`/fiscal/program/?id=${b.id}&r=${b.slug}`} className="group block border-b border-hair py-3">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="min-w-0 truncate text-[14px] font-semibold group-hover:underline">{b.name}</span>
                            <span className="tnum shrink-0 text-[13px] font-bold">{formatBudget(b.budget)}원</span>
                          </span>
                          <span className="mt-1.5 flex items-center gap-3">
                            <span className="relative h-1.5 flex-1 bg-wash">
                              <span className="absolute inset-y-0 left-0 rounded-r-[3px]" style={{ width: `${rate * 100}%`, background: s.fill }} />
                            </span>
                            <span className="tnum w-[4.5rem] shrink-0 text-right text-[11.5px] text-ink-3">집행 {Math.round(rate * 100)}%</span>
                          </span>
                          <span className="mt-1 block text-[11.5px] text-ink-3">
                            {b.level === "central" ? "열린재정" : "지방재정365"} · {b.org}
                            {!b.strict && " · 연결 신뢰도 낮음"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-[13.5px] leading-[1.7] text-ink-3">
                이름·지역이 맞는 청년 세부사업을 찾지 못했습니다. 예산서 사업명에 ‘청년’이 없거나 다른 사업에 묶여 있을 수 있습니다 — 재정사업 코드를 등록할 때 받으면 바로 이어집니다.
              </p>
            )}
          </section>

          {r.same.length > 0 && (
            <section className="mt-10">
              <H2>같은 사업의 다른 등록</H2>
              <p className="mt-1.5 text-[12.5px] text-ink-3">회차·지역 항목이 없어 따로 등록된 건입니다. 인벤토리에서는 한 정책 ID 아래 회차가 됩니다.</p>
              <ol className="mt-3 border-t border-hair">
                {r.same.map((x) => (
                  <li key={x.id}>
                    <Link href={`/notice/program/${x.id}`} className="group flex items-baseline justify-between gap-3 border-b border-hair py-2.5 text-[13px]">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold group-hover:underline">{x.name}</span>
                        <span className="block truncate text-[11.5px] text-ink-3">{x.areas} · 등록 {dot(x.registered)}</span>
                      </span>
                      <span className="tnum shrink-0 text-[12px] text-ink-2">{x.year} · {x.status}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-2">
            {p.onthongUrl && <ExtLink href={p.onthongUrl} primary>온통청년 원문 ↗</ExtLink>}
            {p.applyUrl && /^https?:\/\//.test(p.applyUrl) && <ExtLink href={p.applyUrl}>신청 페이지 ↗</ExtLink>}
            {p.gov24 && <ExtLink href={p.gov24.url}>보조금24 · {p.gov24.name} ↗</ExtLink>}
          </div>
          <dl className="mt-6 space-y-3 border-t border-hair pt-5 text-[13px]">
            <Side k="소관기관" v={p.agency} />
            <Side k="운영기관" v={p.operator || "소관기관이 직접 운영"} />
            {(r.business.begin || r.business.end || r.business.etc) && (
              <Side k="사업 기간" v={r.business.begin || r.business.end ? `${dot(r.business.begin)} ~ ${dot(r.business.end)}` : r.business.etc} />
            )}
            <Side k="최초 등록" v={dot(r.registered)} />
            <Side k="최종 수정" v={dot(r.modified)} />
          </dl>
          <p className="mt-4 text-[11.5px] leading-[1.6] text-ink-3">
            온통청년 등록 정보 기준입니다. 일정과 요건은 바뀔 수 있으니 신청 전 {p.operator || p.agency}의 공고 원문을 확인하세요.
          </p>

          {nearby.length > 0 && (
            <div className="mt-8">
              <h2 className="text-[12px] font-semibold text-ink-3">
                {p.section === "central" ? "중앙부처" : regionLabel}의 다른 {p.type} 정책
              </h2>
              <ol className="mt-2 border-t border-hair">
                {nearby.map((q) => (
                  <li key={q.id}>
                    <Link href={`/notice/program/${q.id}`} className="group block border-b border-hair py-2.5">
                      <span className="block truncate text-[13px] font-semibold group-hover:underline">{q.name}</span>
                      <span className="block truncate text-[11.5px] text-ink-3">{q.agency} · {q.status}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <Link href={`/notice/list?type=${encodeURIComponent(p.type)}&region=${encodeURIComponent(p.region)}`} className="mt-3 inline-block text-[12.5px] font-semibold text-ink-2 hover:text-ink">
                전체 보기 →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}

function isOpen(q: Program) {
  return q.status === "상시" || q.status === "진행중";
}

/** 온통청년 vs 보조금24 conditions, side by side; differences the matcher flagged are marked. */
function Conditions({ r }: { r: PolicyRecord }) {
  const c = r.cond;
  const g = r.gov24;
  const list = (xs: string[]) => (xs.length ? xs.join(" · ") : "제한 없음");
  const rows: { k: string; on: string; gv?: string; diff?: string | null }[] = [
    { k: "나이", on: ageText(c.age), gv: g ? ageText(g.age) : undefined, diff: g?.diff?.age },
    { k: "소득", on: c.income, gv: g?.income, diff: g?.diff?.income },
    { k: "혼인", on: c.marriage ?? "제한 없음" },
    { k: "취업 상태", on: list(c.employment) },
    { k: "학력", on: list(c.education) },
    ...(c.major.length ? [{ k: "전공", on: list(c.major) }] : []),
    { k: "특화 대상", on: list(c.special), gv: g ? list(g.traits) : undefined },
    ...(g && g.household.length ? [{ k: "가구", on: "—", gv: list(g.household) }] : []),
  ];
  return (
    <section className="mt-10">
      <H2>자격 조건</H2>
      {g && (
        <p className="mt-1.5 text-[12.5px] text-ink-3">
          같은 사업으로 대조된 보조금24 서비스의 조건을 나란히 놓았습니다. 두 시스템이 같은 사업을 다르게 적어 두면 청년은 어느 쪽을 믿어야 할지 알 수 없습니다.
        </p>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-hair text-[11.5px] text-ink-3">
              <th className="w-[6.5rem] py-2 font-semibold">항목</th>
              <th className="py-2 font-semibold">온통청년</th>
              {g && <th className="py-2 font-semibold">보조금24</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.k} className="border-b border-hair align-top">
                <th className="py-2.5 pr-3 font-semibold text-ink-2">{x.k}</th>
                <td className="py-2.5 pr-3">{x.on}</td>
                {g && (
                  <td className="py-2.5">
                    {x.gv ?? "—"}
                    {x.diff === "실질 차이" && <span className="ml-1.5 rounded-full border border-ink px-1.5 py-[1px] text-[10.5px] font-semibold">다름</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(c.extra || c.excluded) && (
        <dl className="mt-3 space-y-2 text-[13px] leading-[1.7] text-ink-2">
          {c.extra && <Row k="추가 조건" v={c.extra} />}
          {c.excluded && <Row k="참여 제한" v={c.excluded} />}
        </dl>
      )}
    </section>
  );
}

function Mark({ state }: { state: SlotState }) {
  // shape carries the meaning; no reliance on color
  if (state === "filled") return <span className="inline-block h-2.5 w-2.5 rounded-full bg-ink" aria-label="기재" />;
  if (state === "auto") return <span className="inline-block h-2.5 w-2.5 rounded-full border-[2px] border-ink" aria-label="자동 대조" />;
  if (state === "proposed") return <span className="inline-block h-2.5 w-2.5 rotate-45 border-[1.5px] border-ink-3" aria-label="새로 부여" />;
  return <span className="inline-block h-[2px] w-2.5 bg-ink-3" aria-label="없음" />;
}

function Legend({ state, t }: { state: SlotState; t: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Mark state={state} />
      {t}
    </span>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[15px] font-bold tracking-[-0.02em]">{children}</h2>;
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11.5px] font-semibold text-ink-3">{k}</dt>
      <dd className="mt-1 text-[14.5px] leading-[1.45] font-bold">{v}</dd>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[6.5rem_1fr]">
      <dt className="text-[12px] font-semibold text-ink-3">{k}</dt>
      <dd className="text-ink-2">{v}</dd>
    </div>
  );
}

function Side({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2">
      <dt className="text-[12px] text-ink-3">{k}</dt>
      <dd className="min-w-0 break-words text-ink-2">{v}</dd>
    </div>
  );
}

function ExtLink({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`block truncate rounded-[12px] border px-4 py-2.5 text-[13.5px] font-semibold transition-colors ${
        primary ? "border-ink bg-ink text-onink hover:opacity-90" : "border-hair bg-card text-ink-2 hover:bg-wash"
      }`}
    >
      {children}
    </a>
  );
}
