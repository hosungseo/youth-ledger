import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProgram, meta, programs } from "@/lib/data";
import { REGION_FULL, REGION_SLUG, formatBudget, formatWhen, typeStyle } from "@/lib/design";
import Crumbs from "@/components/Crumbs";

export function generateStaticParams() {
  return programs.map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const p = getProgram((await params).id);
  if (!p) return { title: "찾을 수 없는 사업" };
  return {
    title: p.name,
    description: p.summary || `${p.agency}의 ${p.type} 청년정책.`,
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = getProgram((await params).id);
  if (!p) notFound();

  const s = typeStyle(p.type);
  const regionLabel = REGION_FULL[p.region] ?? p.region;

  // Placement: where this one sits among the sibling programs of its type.
  const siblings = programs
    .filter((q) => q.type === p.type && q.budget != null)
    .sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0));
  const rank = siblings.findIndex((q) => q.id === p.id) + 1;
  const typeBudget = siblings.reduce((sum, q) => sum + (q.budget ?? 0), 0);
  const median = siblings.length
    ? siblings[Math.floor(siblings.length / 2)].budget ?? 0
    : 0;

  // Its immediate neighbours by size — the honest comparison set.
  const at = siblings.findIndex((q) => q.id === p.id);
  const window = at >= 0 ? siblings.slice(Math.max(0, at - 3), at + 4) : siblings.slice(0, 7);

  const maxWindow = Math.max(...window.map((q) => q.budget ?? 0), 1);

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

      <div className="mt-4 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:gap-16">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/notice/list?type=${encodeURIComponent(p.type)}`}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold"
              style={{ color: s.fg }}
            >
              <span className="h-2 w-2" style={{ background: s.fill }} aria-hidden />
              {p.type}
            </Link>
            <span className="text-[13px] text-ink-3">·</span>
            <Link href={`/notice/region/${REGION_SLUG[p.region]}`} className="text-[13px] text-ink-2 hover:text-ink">
              {p.section === "central" ? "중앙부처" : regionLabel}
            </Link>
          </div>

          <h1 className="mt-3 text-[30px] leading-[1.22] font-bold tracking-[-0.03em] text-balance md:text-[40px]">
            {p.name}
          </h1>

          {p.summary && (
            <p className="mt-4 max-w-[620px] text-[15.5px] leading-[1.8] text-ink-2">{p.summary}</p>
          )}

          <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-hair pt-7 sm:grid-cols-3">
            <div>
              <dt className="text-[12px] font-semibold text-ink-3">연결 예산(예산현액)</dt>
              <dd className="tnum mt-1.5 text-[26px] leading-none font-bold tracking-[-0.02em]">
                {p.budget != null ? formatBudget(p.budget) : "연결 없음"}
                {p.budget != null && <span className="ml-1 text-[13px] font-semibold text-ink-2">원</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-ink-3">신청 기간</dt>
              <dd className="mt-1.5 text-[26px] leading-none font-bold tracking-[-0.02em]">
                {formatWhen(p.when)}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] font-semibold text-ink-3">신청 상태</dt>
              <dd className="mt-1.5 text-[26px] leading-none font-bold tracking-[-0.02em]">
                {p.status ?? "—"}
                {rank > 0 && (
                  <span className="ml-2 text-[12px] font-semibold text-ink-3">
                    예산 {rank}위 / {siblings.length}
                  </span>
                )}
              </dd>
            </div>
          </dl>

          <section className="mt-12">
            <h2 className="text-[12px] font-semibold text-ink-3">지원 내용</h2>
            {p.support.length ? (
              <ul className="mt-3 space-y-2">
                {p.support.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[14.5px] leading-[1.7]">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0" style={{ background: s.fill }} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[14px] text-ink-3">공고 원문을 확인하세요.</p>
            )}
          </section>

          <section className="mt-9">
            <h2 className="text-[12px] font-semibold text-ink-3">지원 대상</h2>
            <p className="mt-3 max-w-[620px] text-[14.5px] leading-[1.75]">{p.target || "공고 참조"}</p>
          </section>

          {/* 온통청년 정책을 보조금24(자격·신청)와 예산서(돈)에 잇는 자리 — 청년대장의 핵심 */}
          <section className="mt-9 border-t border-hair pt-7">
            <h2 className="text-[12px] font-semibold text-ink-3">연결</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="border border-hair bg-card p-4">
                <p className="text-[12px] font-semibold text-ink-3">보조금24 서비스</p>
                {p.gov24 ? (
                  <>
                    <a href={p.gov24.url} target="_blank" rel="noreferrer noopener" className="mt-1.5 block text-[15px] font-bold hover:underline">
                      {p.gov24.name} ↗
                    </a>
                    <p className="mt-1 text-[12px] text-ink-3">서비스ID {p.gov24.id} · 매칭 신뢰도 {p.gov24.conf}</p>
                  </>
                ) : (
                  <p className="mt-1.5 text-[13.5px] text-ink-3">자동 매칭으로 찾지 못했습니다.</p>
                )}
              </div>
              <div className="border border-hair bg-card p-4">
                <p className="text-[12px] font-semibold text-ink-3">예산서 세부사업</p>
                {p.fiscal && p.fiscal.length > 0 ? (
                  <ul className="mt-1.5 space-y-1.5">
                    {p.fiscal.map((f, i) => (
                      <li key={i} className="text-[13px] leading-snug">
                        <span className="font-semibold">{f.name}</span>
                        <span className="tnum block text-[12px] text-ink-3">
                          {f.level === "central" ? "열린재정" : "지방재정365"} · {f.org} · {formatBudget(f.budget)}원 · 집행{" "}
                          {f.budget > 0 ? Math.round((f.executed / f.budget) * 100) : 0}%
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-[13.5px] text-ink-3">이름·지역이 맞는 청년 세부사업을 찾지 못했습니다.</p>
                )}
              </div>
            </div>
          </section>

          <section className="mt-9 grid gap-8 border-t border-hair pt-7 sm:grid-cols-2">
            <div>
              <h2 className="text-[12px] font-semibold text-ink-3">소관기관</h2>
              <p className="mt-2 text-[15px] font-bold">{p.agency}</p>
              {p.agencyDept && <p className="mt-0.5 text-[13px] text-ink-2">{p.agencyDept}</p>}
            </div>
            <div>
              <h2 className="text-[12px] font-semibold text-ink-3">운영기관</h2>
              {p.operator ? (
                <>
                  <p className="mt-2 text-[15px] font-bold">{p.operator}</p>
                  {p.operatorDept && <p className="mt-0.5 text-[13px] text-ink-2">{p.operatorDept}</p>}
                </>
              ) : (
                <p className="mt-2 text-[14px] text-ink-3">소관기관이 직접 운영합니다.</p>
              )}
            </div>
            {p.note && (
              <div className="sm:col-span-2">
                <h2 className="text-[12px] font-semibold text-ink-3">지원 내용(원문)</h2>
                <p className="mt-2 text-[14px] leading-[1.7] text-ink-2">{p.note}</p>
              </div>
            )}
          </section>

          <section className="mt-10 border-t border-hair pt-7">
            <p className="max-w-[620px] text-[13.5px] leading-[1.75] text-ink-2">
              여기 실린 내용은 온통청년 등록 정보 기준입니다. 접수 일정과 요건은 바뀔 수 있으니,
              신청 전 <b className="font-semibold text-ink">{p.operator || p.agency}</b>의 공고 원문을
              확인하세요.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.onthongUrl && (
                <a
                  href={p.onthongUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border border-ink bg-ink px-5 py-2.5 text-[13.5px] font-semibold text-onink transition-opacity hover:opacity-90"
                >
                  온통청년 원문 ↗
                </a>
              )}
              {p.applyUrl && /^https?:\/\//.test(p.applyUrl) && (
                <a
                  href={p.applyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="border border-hair bg-card px-5 py-2.5 text-[13.5px] font-semibold text-ink-2 transition-colors hover:bg-wash"
                >
                  신청 페이지 ↗
                </a>
              )}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`${p.agency} ${p.name} 공고`)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="border border-hair bg-card px-5 py-2.5 text-[13.5px] font-semibold text-ink-2 transition-colors hover:bg-wash"
              >
                기관 공고 검색 ↗
              </a>
            </div>
          </section>
        </div>

        {/* Placement rail: this program against the ones nearest its size. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-[12px] font-semibold text-ink-3">예산이 연결된 {p.type} 정책</h2>
          <p className="mt-2 text-[12.5px] leading-[1.65] text-ink-3">
            예산서와 이어지는 {p.type} 정책 {siblings.length}건의 중앙값은 {formatBudget(median)}원,
            합계는 {formatBudget(typeBudget)}원입니다.
          </p>

          <ol className="mt-4 border-t border-hair">
            {window.map((q) => {
              const me = q.id === p.id;
              return (
                <li key={q.id}>
                  <Link
                    href={`/notice/program/${q.id}`}
                    aria-current={me ? "page" : undefined}
                    className={`block border-b border-hair py-3 ${me ? "" : "group"}`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span
                        className={`truncate text-[13px] ${
                          me ? "font-bold text-ink" : "text-ink-2 group-hover:text-ink group-hover:underline"
                        }`}
                      >
                        {me && <span className="mr-1" aria-hidden>▸</span>}
                        {q.name}
                      </span>
                      <span className={`tnum shrink-0 text-[12.5px] ${me ? "font-bold" : "text-ink-2"}`}>
                        {formatBudget(q.budget)}
                      </span>
                    </span>
                    <span className="mt-1.5 block h-1.5 w-full bg-wash">
                      <span
                        className="block h-full"
                        style={{
                          width: `${((q.budget ?? 0) / maxWindow) * 100}%`,
                          background: me ? s.fill : `color-mix(in oklab, ${s.fill} 38%, ${s.tile})`,
                        }}
                      />
                    </span>
                    <span className="mt-1 block text-[11.5px] text-ink-3">
                      {q.region === "중앙" ? "중앙부처" : q.region} · {q.agency}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <Link
            href={`/notice/list?type=${encodeURIComponent(p.type)}`}
            className="mt-4 inline-block text-[13px] font-semibold text-ink-2 hover:text-ink"
          >
            {p.type} {meta.types.find((t) => t.value === p.type)?.count ?? siblings.length}개 전체 →
          </Link>
        </aside>
      </div>
    </article>
  );
}
