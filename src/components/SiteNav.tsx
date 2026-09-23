"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BASES, BASIS_LIST, basisOf, counterpart } from "@/lib/basis";

/**
 * 헤더가 계층을 그대로 보여 준다.
 *
 *   윗줄 — 청년대장 · [온통청년 기준 | 재정 기준] · 자료
 *   아랫줄 — 그 기준 안의 페이지들 (기준 밖에서는 줄 자체가 없다)
 *
 * 전에는 기준이 클릭되지 않는 딱지였고 "기준 바꾸기"가 페이지 링크들 사이에
 * 끼어 있었다. 같은 줄에 세 단이 섞여 있으니 어디에 있는지가 읽히지 않았다.
 */
export default function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const basis = basisOf(pathname);
  const pages = basis ? BASES[basis].pages : [];

  // 판·목록은 자기 경로가 정확히 맞을 때만 켠다. /notice/list?type=… 같은
  // 쿼리는 같은 페이지이므로 경로 비교로 충분하다.
  const isHere = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-hair bg-paper/90 backdrop-blur-md">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <div className="flex items-center justify-between gap-4 py-3.5">
          <Link href="/" className="flex shrink-0 items-baseline gap-2.5">
            <span className="text-[17px] font-bold tracking-[-0.02em]">청년대장</span>
            <span className="tnum text-[12px] text-ink-3">2026</span>
          </Link>

          {/* 기준 토글. 두 칸이 늘 함께 보여야 "다른 장부가 있다"가 읽힌다. */}
          <nav
            aria-label="기준"
            className="flex overflow-hidden rounded-full border border-hair bg-card"
          >
            {BASIS_LIST.map((b) => {
              const on = basis === b.key;
              return (
                <Link
                  key={b.key}
                  href={basis ? counterpart(pathname, b.key) : b.home}
                  aria-current={on ? "true" : undefined}
                  title={b.gloss}
                  className={`px-3.5 py-1.5 text-[12.5px] transition-colors md:px-4 ${
                    on
                      ? "bg-ink font-semibold text-onink"
                      : "font-medium text-ink-2 hover:bg-wash"
                  }`}
                >
                  {b.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-5 md:flex">
            <Link
              href="/find"
              aria-current={pathname === "/find" ? "page" : undefined}
              className={`text-[13px] transition-colors ${
                pathname === "/find" ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              내 조건
            </Link>
            <Link
              href="/link"
              aria-current={pathname === "/link" ? "page" : undefined}
              className={`text-[13px] transition-colors ${
                pathname === "/link" ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              종합
            </Link>
            <Link
              href="/quality"
              aria-current={pathname === "/quality" ? "page" : undefined}
              className={`text-[13px] transition-colors ${
                pathname === "/quality" ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              점검
            </Link>
            <Link
              href="/proposal"
              aria-current={pathname === "/proposal" ? "page" : undefined}
              className={`text-[13px] transition-colors ${
                pathname === "/proposal" ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              제안
            </Link>
            <Link
              href="/about"
              aria-current={pathname === "/about" ? "page" : undefined}
              className={`text-[13px] transition-colors ${
                pathname === "/about" ? "font-semibold text-ink" : "text-ink-2 hover:text-ink"
              }`}
            >
              자료
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
            className="shrink-0 text-[13px] text-ink-2 md:hidden"
          >
            {open ? "닫기" : "메뉴"}
          </button>
        </div>

        {/* 두 번째 단. 기준 안에 들어와 있을 때만 선다. */}
        {basis && (
          <nav
            aria-label={`${BASES[basis].label} 페이지`}
            className="hidden items-center gap-1 pb-2 md:flex"
          >
            {pages.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                aria-current={isHere(p.href) ? "page" : undefined}
                title={p.hint}
                className={`rounded-full px-3 py-1 text-[13px] transition-colors ${
                  isHere(p.href)
                    ? "bg-wash-2 font-semibold text-ink"
                    : "text-ink-2 hover:bg-wash hover:text-ink"
                }`}
              >
                {p.label}
              </Link>
            ))}
            <span className="ml-3 border-l border-hair pl-3 text-[12px] text-ink-3">
              {BASES[basis].gloss}
            </span>
          </nav>
        )}
      </div>

      {open && (
        <div className="border-t border-hair bg-card md:hidden">
          <div className="mx-auto max-w-[1180px] px-5 py-2">
            {basis && (
              <>
                <p className="pt-2 pb-1 text-[11.5px] font-semibold text-ink-3">
                  {BASES[basis].label}
                </p>
                {pages.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-baseline gap-2.5 py-2.5 text-[15px] ${
                      isHere(p.href) ? "font-semibold text-ink" : "text-ink-2"
                    }`}
                  >
                    {p.label}
                    <span className="text-[12px] text-ink-3">{p.hint}</span>
                  </Link>
                ))}
              </>
            )}
            <div className="mt-2 flex gap-6 border-t border-hair pt-3 pb-2">
              <Link href="/" onClick={() => setOpen(false)} className="text-[14px] text-ink-2">
                두 기준 견주기
              </Link>
              <Link href="/find" onClick={() => setOpen(false)} className="text-[14px] text-ink-2">
                내 조건
              </Link>
              <Link href="/link" onClick={() => setOpen(false)} className="text-[14px] text-ink-2">
                종합
              </Link>
              <Link href="/quality" onClick={() => setOpen(false)} className="text-[14px] text-ink-2">
                점검
              </Link>
              <Link href="/proposal" onClick={() => setOpen(false)} className="text-[14px] text-ink-2">
                제안
              </Link>
              <Link href="/about" onClick={() => setOpen(false)} className="text-[14px] text-ink-2">
                자료
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
