import Link from "next/link";
import { formatBudget } from "@/lib/design";

export interface CompareRow {
  key: string;
  label: string;
  href: string | null;
  color?: string;
  noticeCount: number;
  noticeBudget: number;
  fiscalCount: number;
  fiscalBudget: number;
  /** false when the two bases read different levels of the same money. */
  budgetComparable: boolean;
}

/** Two bases side by side, with the ratio between them as the point. */
export default function CompareTable({
  rows,
  unit,
}: {
  rows: CompareRow[];
  unit: string;
}) {
  const maxCount = Math.max(...rows.map((r) => Math.max(r.noticeCount, r.fiscalCount)), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-separate border-spacing-0">
        <thead>
          <tr>
            <th scope="col" className="border-b border-hair pb-2.5 text-left text-[11.5px] font-semibold text-ink-3">
              {unit}
            </th>
            <th scope="col" colSpan={2} className="border-b border-hair pb-2.5 text-left text-[11.5px] font-semibold text-ink-3">
              사업 수 · 온통청년 → 재정
            </th>
            <th scope="col" className="border-b border-hair pb-2.5 text-right text-[11.5px] font-semibold text-ink-3">
              배수
            </th>
            <th scope="col" className="border-b border-hair pb-2.5 text-right text-[11.5px] font-semibold text-ink-3">
              연결 예산
            </th>
            <th scope="col" className="border-b border-hair pb-2.5 text-right text-[11.5px] font-semibold text-ink-3">
              재정 예산
            </th>
            <th scope="col" className="border-b border-hair pb-2.5 text-right text-[11.5px] font-semibold text-ink-3">
              배수
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => {
            const cx = r.noticeCount > 0 ? r.fiscalCount / r.noticeCount : null;
            const bx =
              r.budgetComparable && r.noticeBudget > 0 ? r.fiscalBudget / r.noticeBudget : null;
            const accent = r.color ?? "var(--color-t-biz)";
            return (
              <tr key={r.key}>
                <td className="border-b border-hair py-3 pr-4 align-middle">
                  <span className="flex items-center gap-2">
                    {r.color && (
                      <span className="h-2.5 w-2.5 shrink-0" style={{ background: r.color }} aria-hidden />
                    )}
                    {r.href ? (
                      <Link href={r.href} className="text-[13.5px] font-semibold hover:underline">
                        {r.label}
                      </Link>
                    ) : (
                      <span className="text-[13.5px] font-semibold">{r.label}</span>
                    )}
                  </span>
                </td>

                <td className="tnum border-b border-hair py-3 pr-3 text-right align-middle text-[13px] font-semibold text-ink-2">
                  {r.noticeCount.toLocaleString("ko-KR")}
                </td>

                <td className="w-[38%] border-b border-hair py-3 pr-4 align-middle">
                  {/* The notice bar sits inside the fiscal bar: what the 공고 caught. */}
                  <span className="relative block h-5 bg-wash">
                    <span
                      className="absolute inset-y-0 left-0 opacity-40"
                      style={{ width: `${(r.fiscalCount / maxCount) * 100}%`, background: accent }}
                    />
                    <span
                      className="absolute inset-y-0 left-0"
                      style={{ width: `${(r.noticeCount / maxCount) * 100}%`, background: "var(--color-ink)" }}
                    />
                    <span
                      className="tnum absolute top-1/2 -translate-y-1/2 pl-1.5 text-[11px] font-semibold text-ink-2"
                      style={{ left: `${(r.fiscalCount / maxCount) * 100}%` }}
                    >
                      {r.fiscalCount.toLocaleString("ko-KR")}
                    </span>
                  </span>
                </td>

                <td className="tnum border-b border-hair py-3 pl-2 text-right align-middle text-[13.5px] font-bold">
                  {cx == null ? (
                    <span className="text-[12px] font-medium text-ink-3">—</span>
                  ) : (
                    <>
                      {cx.toFixed(1)}
                      <span className="text-[11px] font-semibold text-ink-3">배</span>
                    </>
                  )}
                </td>

                <td className="tnum border-b border-hair py-3 pl-4 text-right align-middle text-[12.5px] text-ink-2">
                  {formatBudget(r.noticeBudget)}
                </td>
                <td className="tnum border-b border-hair py-3 pl-4 text-right align-middle text-[12.5px] text-ink-2">
                  {formatBudget(r.fiscalBudget)}
                </td>
                <td className="tnum border-b border-hair py-3 pl-4 text-right align-middle text-[13px] font-bold">
                  {bx == null ? (
                    <span
                      className="text-[12px] font-medium text-ink-3"
                      title="두 기준이 다른 층위를 보아 더하거나 나눌 수 없습니다"
                    >
                      비교 불가
                    </span>
                  ) : (
                    <>
                      {bx.toFixed(1)}
                      <span className="text-[11px] font-semibold text-ink-3">배</span>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <p className="mt-3 text-[11.5px] leading-[1.7] text-ink-3">
        막대는 사업 수. 검은 부분이 온통청년에 등록된 정책 수, 연한 부분까지가 예산 자료에 잡힌 청년 세부사업입니다. ‘연결 예산’은 온통청년 정책과 이어진 세부사업의 예산현액입니다.
      </p>
    </div>
  );
}
