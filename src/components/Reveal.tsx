"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Scroll-in reveal that can never hide content.
 *
 * `whileInView` starts an element at opacity 0, so anything that keeps the
 * observer from firing — reduced motion, print, a headless capture — would
 * leave the section permanently blank. When motion is not wanted we render a
 * plain element instead of an animated one, so the content is simply there.
 */
export default function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
