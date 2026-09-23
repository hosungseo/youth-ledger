import Link from "next/link";
import { BASIS_LIST } from "@/lib/basis";

/** 꼬리말도 헤더와 같은 단으로 선다 — 아홉 개를 한 줄에 늘어놓지 않는다. */
export default function SiteFooter({ source }: { source: string }) {
  return (
    <footer className="mt-20 border-t border-hair">
      <div className="mx-auto max-w-[1180px] px-5 py-10 md:px-8">
        <div className="grid gap-9 md:grid-cols-[minmax(0,1fr)_auto_auto] md:gap-14">
          <div>
            <Link href="/" className="text-[14px] font-bold tracking-[-0.02em] hover:text-ink">
              청년대장 2026
            </Link>
            <p className="mt-2.5 max-w-[420px] text-[12.5px] leading-[1.8] text-ink-2">
              출처 · {source}
              <br />
              비공식 개념검증(PoC)입니다. 예산현액은 계획액이며, 온통청년·예산서 연결은 자동 판정입니다.
              신청 전 소관기관 공고와 온통청년·보조금24 원문을 반드시 확인하세요.
            </p>
            <div className="mt-4 flex gap-5 text-[12.5px] text-ink-2">
              <Link href="/" className="hover:text-ink">처음으로</Link>
              <Link href="/about" className="hover:text-ink">자료</Link>
              <a
                href="https://www.youthcenter.go.kr"
                target="_blank"
                rel="noreferrer noopener"
                className="hover:text-ink"
              >
                온통청년 ↗
              </a>
            </div>
          </div>

          {BASIS_LIST.map((b) => (
            <nav key={b.key} aria-label={b.label}>
              <p className="text-[12px] font-semibold text-ink-3">{b.label}</p>
              <ul className="mt-2.5 space-y-1.5">
                {b.pages.map((p) => (
                  <li key={p.href}>
                    <Link href={p.href} className="text-[12.5px] text-ink-2 hover:text-ink">
                      {p.label}
                      <span className="ml-2 text-ink-3">{p.hint}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}
