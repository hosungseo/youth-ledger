"use client";

import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

function Counter({ to, decimals = 0 }: { to: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 22 });

  useEffect(() => {
    if (inView || reduced) mv.set(to);
  }, [inView, reduced, to, mv]);

  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) {
          ref.current.textContent = v.toLocaleString("ko-KR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        }
      }),
    [spring, decimals],
  );

  // Server-render the real figure so it is correct before (and without) JS.
  return (
    <span ref={ref} className="tnum">
      {to.toLocaleString("ko-KR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

export interface Stat {
  label: string;
  value: number;
  decimals?: number;
  unit: string;
  note?: string;
}

export default function StatBand({ stats }: { stats: Stat[] }) {
  const reduced = useReducedMotion();
  const enter = reduced
    ? {}
    : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 } };

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-hair bg-hair md:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          {...enter}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: i * 0.07 }}
          className="bg-card px-5 py-6"
        >
          <p className="text-[12px] font-semibold text-ink-3">{s.label}</p>
          <p className="mt-2 text-[30px] leading-none font-bold tracking-[-0.03em]">
            <Counter to={s.value} decimals={s.decimals} />
            <span className="ml-1 text-[15px] font-semibold text-ink-2">{s.unit}</span>
          </p>
          {s.note && <p className="mt-2 text-[11.5px] text-ink-3">{s.note}</p>}
        </motion.div>
      ))}
    </div>
  );
}
