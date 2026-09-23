"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export default function MonthStrip({
  histogram,
  always,
  alreadyAnnounced = 0,
  undecided = 0,
}: {
  histogram: { month: number; count: number }[];
  always: number;
  alreadyAnnounced?: number;
  undecided?: number;
}) {
  const reduced = useReducedMotion();
  const max = Math.max(...histogram.map((m) => m.count), 1);

  return (
    <div className="rounded-[20px] border border-hair bg-card p-6">
      <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height: 156 }}>
        {histogram.map((m, i) => (
          <Link
            key={m.month}
            href={`/notice/list?month=${m.month}`}
            className="group flex h-full flex-1 flex-col justify-end"
            aria-label={`${m.month}월 공고 ${m.count}개`}
          >
            <span className="tnum mb-1.5 text-center text-[11.5px] font-bold text-ink-2 opacity-0 transition-opacity group-hover:opacity-100">
              {m.count}
            </span>
            <motion.span
              style={reduced ? { height: `${Math.max(4, (m.count / max) * 100)}%` } : undefined}
              initial={reduced ? undefined : { height: 0 }}
              whileInView={reduced ? undefined : { height: `${Math.max(4, (m.count / max) * 100)}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="block w-full rounded-t-[6px] bg-t-biz/25 transition-colors group-hover:bg-t-biz"
            />
          </Link>
        ))}
      </div>

      <div className="mt-2.5 flex gap-1.5 sm:gap-2.5">
        {histogram.map((m) => (
          <span
            key={m.month}
            className="tnum flex-1 text-center text-[11px] font-medium text-ink-3"
          >
            {m.month}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-hair pt-4">
        <p className="max-w-[440px] text-[12.5px] leading-[1.7] text-ink-2">
          막대는 <b className="font-semibold text-ink">2026년</b>에 공고가 나는 사업 수입니다.
          한 사업이 여러 달에 걸치면 각 달에 셉니다.
          {alreadyAnnounced > 0 && ` 2025년에 이미 공고가 난 ${alreadyAnnounced}건은 뺐습니다.`}
          {undecided > 0 && ` 시기를 못 박지 않은 ${undecided}건도 빠집니다.`}
        </p>
        <Link
          href="/notice/list?when=always"
          className="tnum shrink-0 rounded-full bg-wash px-3.5 py-1.5 text-[12px] font-semibold text-ink-2 transition-colors hover:bg-wash-2"
        >
          연중 상시 {always}개 →
        </Link>
      </div>
    </div>
  );
}
