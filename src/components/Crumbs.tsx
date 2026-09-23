import Link from "next/link";
import { BASES, type Basis } from "@/lib/basis";

/**
 * 낱장에서 지금 어느 장부의 어느 페이지 아래에 있는지 되짚어 준다.
 * 헤더는 기준과 페이지까지만 보여 주므로, 그 아래 단은 여기서 잇는다.
 */
export default function Crumbs({
  basis,
  trail,
  here,
}: {
  basis: Basis;
  trail?: { href: string; label: string }[];
  here: string;
}) {
  const b = BASES[basis];
  return (
    <nav
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-ink-3"
      aria-label="위치"
    >
      <Link href={b.home} className="hover:text-ink">
        {b.label}
      </Link>
      {(trail ?? []).map((t) => (
        <span key={t.href} className="flex items-center gap-1.5">
          <span aria-hidden>›</span>
          <Link href={t.href} className="hover:text-ink">
            {t.label}
          </Link>
        </span>
      ))}
      <span aria-hidden>›</span>
      <span className="text-ink-2">{here}</span>
    </nav>
  );
}
