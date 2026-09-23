"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/youth-ledger";

/** [kind, id, name, org, region, type, extra] — p: 온통청년 정책(extra=상태), f: 청년 세부사업(extra=지역 shard) */
type Entry = [kind: "p" | "f", id: string, name: string, org: string, region: string, type: string, extra: string];
type Hit = { e: Entry; href: string; score: number };

let index: Promise<Entry[]> | null = null;
const load = () =>
  (index ??= fetch(`${BASE}/data/search.json`).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<Entry[]>;
  }));

const norm = (s: string) => s.toLowerCase().replace(/[\s·()\[\]「」'"‘’“”,.-]/g, "");
const hrefOf = (e: Entry) => (e[0] === "p" ? `/notice/program/${e[1]}` : `/fiscal/program/?id=${e[1]}&r=${e[6]}`);

function search(entries: Entry[], query: string) {
  const q = norm(query);
  const tokens = query.split(/\s+/).map(norm).filter(Boolean);
  if (!q) return { p: [] as Hit[], f: [] as Hit[], np: 0, nf: 0, partial: false };
  const run = (need: number) => {
    const hits: Hit[] = [];
    for (const e of entries) {
      const name = norm(e[2]);
      const hay = name + norm(e[3]) + norm(e[4]);
      const matched = tokens.filter((t) => hay.includes(t)).length;
      if (matched < need) continue;
      const score = matched * 10 + (name.startsWith(q) ? 4 : name.includes(q) ? 3 : 1) + (e[0] === "p" && (e[6] === "상시" || e[6] === "진행중") ? 0.5 : 0);
      hits.push({ e, href: hrefOf(e), score });
    }
    return hits.sort((a, b) => b.score - a.score || a.e[2].length - b.e[2].length);
  };
  // every word first; if nothing has them all, fall back to anything matching some of them
  let hits = run(tokens.length);
  const partial = hits.length === 0 && tokens.length > 1;
  if (partial) hits = run(1);
  const p = hits.filter((h) => h.e[0] === "p");
  const f = hits.filter((h) => h.e[0] === "f");
  return { p: p.slice(0, 7), f: f.slice(0, 7), np: p.length, nf: f.length, partial };
}

/** Header search: a button (and the "/" key) opens a dialog over the page. */
export default function SearchDialog({ compact, hero }: { compact?: boolean; hero?: boolean }) {
  const [open, setOpen] = useState(false);

  // only the desktop header instance owns the "/" shortcut — others are mounted at the same time
  const hotkey = !compact && !hero;
  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "/" && !typing && !open) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hotkey]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        onMouseEnter={() => void load().catch(() => {})}
        aria-label="검색"
        className={
          hero
            ? "flex w-full items-center gap-3 rounded-[16px] border border-hair bg-card px-5 py-4 text-left text-[15px] text-ink-3 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-colors hover:border-ink-3"
            : compact
              ? "shrink-0 p-1 text-ink-2 hover:text-ink"
              : "inline-flex items-center gap-2 rounded-full border border-hair bg-card px-3 py-1.5 text-[12.5px] text-ink-2 transition-colors hover:bg-wash"
        }
      >
        <SearchIcon />
        {hero && (
          <>
            <span className="min-w-0 flex-1 truncate">정책·세부사업 이름, 기관, 지역으로 찾기 — 예: 면접수당, 청년월세 부산</span>
            <kbd className="hidden rounded border border-hair px-1.5 text-[11px] sm:inline">/</kbd>
          </>
        )}
        {!compact && !hero && (
          <>
            검색
            <kbd className="rounded border border-hair px-1 text-[10.5px] text-ink-3">/</kbd>
          </>
        )}
      </button>
      {open && <Panel onClose={() => setOpen(false)} />}
    </>
  );
}

function Panel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    load()
      .then(setEntries)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const res = useMemo(() => (entries ? search(entries, q) : null), [entries, q]);
  const flat = useMemo(() => (res ? [...res.p, ...res.f] : []), [res]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(flat.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter" && flat[cursor]) {
      e.preventDefault();
      go(flat[cursor].href);
    }
  };

  const group = (title: string, hits: Hit[], n: number, offset: number, more: string) =>
    hits.length > 0 && (
      <section className="mt-3">
        <p className="flex items-baseline justify-between px-1 text-[11.5px] font-semibold text-ink-3">
          <span>
            {title} {n.toLocaleString("ko-KR")}건
          </span>
          {n > hits.length && (
            <Link href={more} onClick={onClose} className="font-medium hover:text-ink">
              목록에서 모두 보기 →
            </Link>
          )}
        </p>
        <ul className="mt-1">
          {hits.map((h, i) => {
            const on = cursor === offset + i;
            return (
              <li key={h.e[0] + h.e[1]}>
                <Link
                  href={h.href}
                  onClick={onClose}
                  onMouseEnter={() => setCursor(offset + i)}
                  className={`block rounded-[10px] px-3 py-2 ${on ? "bg-wash" : ""}`}
                  aria-current={on ? "true" : undefined}
                >
                  <span className="block truncate text-[14px] font-semibold">{h.e[2]}</span>
                  <span className="block truncate text-[11.5px] text-ink-3">
                    {h.e[4] === "중앙" ? "중앙부처" : h.e[4]} · {h.e[3]} · {h.e[5]}
                    {h.e[0] === "p" && h.e[6] ? ` · ${h.e[6]}` : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/35 px-3 pt-[max(12vh,env(safe-area-inset-top,0px))]" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="청년정책·세부사업 검색"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
        className="w-full max-w-[640px] overflow-hidden rounded-[18px] border border-hair bg-card text-ink shadow-[0_18px_60px_rgba(0,0,0,0.25)]"
      >
        <div className="flex items-center gap-3 border-b border-hair px-4 py-3">
          <SearchIcon />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCursor(0);
            }}
            placeholder="정책·세부사업 이름, 기관, 지역 — 예: 면접수당, 청년월세 부산"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-3"
            aria-label="검색어"
          />
          <button type="button" onClick={onClose} className="shrink-0 text-[12px] text-ink-3 hover:text-ink">
            닫기
          </button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto px-3 pb-3">
          {error && <p className="px-1 py-6 text-[13px] text-ink-3">검색 자료를 불러오지 못했습니다: {error}</p>}
          {!error && !entries && <p className="px-1 py-6 text-[13px] text-ink-3">검색 자료를 불러오는 중…</p>}
          {entries && !q && (
            <p className="px-1 py-6 text-[13px] leading-[1.7] text-ink-3">
              온통청년 정책 {entries.filter((e) => e[0] === "p").length.toLocaleString("ko-KR")}건과 예산서의 청년 세부사업{" "}
              {entries.filter((e) => e[0] === "f").length.toLocaleString("ko-KR")}건을 이름·기관·지역으로 찾습니다. 띄어 쓴 낱말은 모두 들어간 것만 보여 줍니다.
            </p>
          )}
          {res && q && res.np + res.nf === 0 && <p className="px-1 py-6 text-[13px] text-ink-3">‘{q}’에 맞는 정책·세부사업이 없습니다.</p>}
          {res && res.partial && res.np + res.nf > 0 && (
            <p className="px-1 pt-3 text-[12px] text-ink-3">낱말이 모두 들어간 것은 없어, 일부가 맞는 것을 보여 줍니다.</p>
          )}
          {res && group("온통청년 정책", res.p, res.np, 0, `/notice/list?q=${encodeURIComponent(q)}`)}
          {res && group("예산서 청년 세부사업", res.f, res.nf, res.p.length, `/fiscal/list?q=${encodeURIComponent(q)}`)}
        </div>
        <p className="hidden border-t border-hair px-4 py-2 text-[11px] text-ink-3 sm:block">↑↓ 이동 · Enter 열기 · Esc 닫기</p>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}
