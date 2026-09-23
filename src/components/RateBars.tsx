import Link from "next/link";
import { formatBudget } from "@/lib/design";

export interface RateRow {
  key: string;
  label: string;
  budget: number;
  executed: number;
  /** 몇 개 사업을 접은 값인지. 한 사업짜리 100%와 구별하려면 필요하다. */
  programs?: number;
  /** 이름만으로는 어디인지 모를 때(과 이름 등) 붙이는 소속. */
  sub?: string;
  href?: string;
  color?: string;
}

/**
 * 집행률 한 줄씩. 지역·유형·부문이 모두 같은 모양이라 한 군데서 그린다.
 *
 * 막대는 예산 대비 집행 비율이고, 막대의 폭은 예산 크기와 무관하다. 그래서
 * 옆에 금액을 함께 적는다 — 8억짜리의 85%와 2,000억짜리의 45%를 같은 길이로
 * 보이게 두면 판단을 그르친다.
 */
export default function RateBars({ rows }: { rows: RateRow[] }) {
  const maxBudget = Math.max(1, ...rows.map((r) => r.budget));

  return (
    <ol className="border-t border-hair">
      {rows.map((r) => {
        const pct = r.budget > 0 ? r.executed / r.budget : 0;
        const label = (
          <>
            <span className="block truncate text-[14px] font-semibold">{r.label}</span>
            {(r.programs != null || r.sub) && (
              <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">
                {r.sub}
                {r.sub && r.programs != null && " · "}
                {r.programs != null && (
                  <span className="tnum">{r.programs.toLocaleString("ko-KR")}건</span>
                )}
              </span>
            )}
          </>
        );

        return (
          <li
            key={r.key}
            className="grid grid-cols-[8rem_1fr_7.5rem_3.5rem] items-center gap-3 border-b border-hair py-3 md:gap-4"
          >
            <span className="min-w-0">
              {r.href ? (
                <Link href={r.href} className="block hover:underline">
                  {label}
                </Link>
              ) : (
                label
              )}
            </span>

            <span className="min-w-0">
              {/* 바깥 테두리가 예산 크기, 안쪽 채움이 집행분이다. */}
              <span
                className="relative block h-5 bg-wash"
                style={{ width: `${Math.max(6, (r.budget / maxBudget) * 100)}%` }}
                title={`예산 ${formatBudget(r.budget)}원 중 ${formatBudget(r.executed)}원 집행`}
              >
                <span
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${Math.min(100, pct * 100)}%`,
                    background: r.color ?? "var(--color-t-biz)",
                  }}
                />
              </span>
            </span>

            <span className="tnum text-right text-[12.5px] text-ink-2">
              {formatBudget(r.executed)} / {formatBudget(r.budget)}
            </span>
            <span className="tnum text-right text-[15px] font-bold">
              {Math.round(pct * 100)}%
            </span>
          </li>
        );
      })}
    </ol>
  );
}
