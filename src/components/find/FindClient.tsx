"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  INCOME_LABELS,
  countFor,
  findFor,
  type FindData,
  type Person,
  type Status,
} from "@/lib/find";
import StripChart, { type StripRow } from "@/components/link/StripChart";

// reference categorical slots (validated adjacent pairs on the light surface)
const C_ON = "#2a78d6"; // 온통청년
const C_BOTH = "#4a3aa7"; // 둘 다
const C_G24 = "#1baf7a"; // 보조금24
const C_BUDGET = "#eb6834"; // 예산서에만

const STATUSES: { key: Status; label: string }[] = [
  { key: "", label: "해당 없음·모름" },
  { key: "미취업", label: "구직 중" },
  { key: "재직", label: "직장인" },
  { key: "창업", label: "창업(예정)" },
  { key: "대학생", label: "대학(원)생" },
  { key: "농어업", label: "농어업" },
];

const PRESETS: { label: string; q: Record<string, string> }[] = [
  { label: "서울 관악구 · 25세 · 구직 중 · 1인가구", q: { sido: "서울", place: "관악구", age: "25", st: "미취업", single: "1", nohouse: "1" } },
  { label: "전북 무주군 · 28세 · 농어업", q: { sido: "전북", place: "무주군", age: "28", st: "농어업" } },
  { label: "인천 부평구 · 32세 · 직장인 · 기혼", q: { sido: "인천", place: "부평구", age: "32", st: "재직", married: "1" } },
];

const PAGE = 20;
const gov24Url = (id: string) => `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${id}`;

export default function FindClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [data, setData] = useState<FindData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // conditions live in the URL so a result can be shared as a link
  const sido = params.get("sido") ?? "서울";
  const placeName = params.get("place") ?? "관악구";
  const age = Math.max(15, Math.min(49, Number(params.get("age") ?? 25) || 25));
  const incomeRaw = params.get("inc");
  const income = incomeRaw == null || incomeRaw === "" ? null : Number(incomeRaw);
  const status = (params.get("st") ?? "") as Status;
  const single = params.get("single") === "1";
  const noHouse = params.get("nohouse") === "1";
  const married = params.get("married") === "1";

  const [openOnly, setOpenOnly] = useState(true);
  const [youthOnly, setYouthOnly] = useState(true);
  const [shown, setShown] = useState({ on: PAGE, g: PAGE, b: 10 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? "/youth-ledger"}/data/find.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData((await res.json()) as FindData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    void load();
  }, []);

  const set = (patch: Record<string, string | null>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") q.delete(k);
      else q.set(k, v);
    }
    router.replace(`?${q.toString()}`, { scroll: false });
    setShown({ on: PAGE, g: PAGE, b: 10 });
  };

  const sidos = useMemo(() => (data ? [...new Set(data.places.map((p) => p.sido))] : []), [data]);
  const placesInSido = useMemo(() => (data ? data.places.filter((p) => p.sido === sido) : []), [data, sido]);
  const place = placesInSido.find((p) => p.name === placeName) ?? placesInSido[0];

  const person: Person | null = place
    ? { place: place.code, sido: place.sido, age, income, status, single, noHouse, married }
    : null;

  const result = useMemo(() => (data && person ? findFor(data, person) : null), [data, person?.place, age, income, status, single, noHouse, married]); // eslint-disable-line react-hooks/exhaustive-deps

  // the same person, moved to every 시·군·구
  const sweep = useMemo(() => {
    if (!data || !person) return null;
    const pts = data.places.map((pl) => {
      const c = countFor(data, { ...person, place: pl.code, sido: pl.sido }, true, true);
      return { id: pl.code, name: `${pl.sido} ${pl.name}`, sido: pl.sido, value: c.on + c.g, note: `온통청년 ${c.on} · 보조금24 청년 ${c.g}` };
    });
    const bySido = new Map<string, typeof pts>();
    for (const p of pts) bySido.set(p.sido, [...(bySido.get(p.sido) ?? []), p]);
    const med = (xs: number[]) => {
      const s = [...xs].sort((a, b) => a - b);
      return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    };
    const rows: StripRow[] = [...bySido.entries()]
      .map(([k, v]) => ({ key: k, label: k, median: med(v.map((x) => x.value)), points: v }))
      .sort((a, b) => b.median - a.median);
    const vals = pts.map((p) => p.value).sort((a, b) => a - b);
    const mine = pts.find((p) => p.id === person.place)?.value ?? 0;
    return { rows, max: Math.max(...vals) * 1.05, min: vals[0], top: vals[vals.length - 1], mine, rank: vals.filter((v) => v > mine).length + 1, n: vals.length };
  }, [data, person?.place, age, income, status, single, noHouse, married]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="py-10 text-[14px] text-ink-3">자료를 불러오지 못했습니다: {error}</p>;
  if (!data || !result || !person || !sweep) return <p className="py-10 text-[14px] text-ink-3">세 장부를 불러오는 중…</p>;

  const on = result.onthong.filter((x) => !openOnly || x.item.s === "상시" || x.item.s === "진행중");
  const onClear = on.filter((x) => x.check.length === 0);
  const onCheck = on.filter((x) => x.check.length > 0);
  const g = result.gov24.filter((x) => !youthOnly || x.item.y);
  const bothIds = result.both;
  const bothN = on.filter((x) => bothIds.has(x.item.id)).length;
  const onOnly = on.length - bothN;
  const gOnly = Math.max(0, g.length - bothN);
  const total = onOnly + bothN + gOnly + result.budget.length || 1;
  // only what the 광역·시군구 itself runs — nationwide items removed
  const localOn = on.filter((x) => !x.item.r.includes("ALL")).length;
  const localG = g.filter((x) => x.item.r !== "ALL").length;

  return (
    <div>
      {/* conditions */}
      <section className="rounded-[20px] border border-hair bg-card p-5 md:p-6" aria-label="내 조건">
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr_1fr]">
          <Field label="사는 곳">
            <div className="flex gap-2">
              <select value={sido} onChange={(e) => set({ sido: e.target.value, place: null })} className="sel" aria-label="광역">
                {sidos.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select value={place?.name} onChange={(e) => set({ place: e.target.value })} className="sel flex-1" aria-label="시군구">
                {placesInSido.map((p) => (
                  <option key={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
          </Field>
          <Field label={`나이 · 만 ${age}세`}>
            <input
              type="range"
              min={15}
              max={49}
              value={age}
              onChange={(e) => set({ age: e.target.value })}
              className="w-full accent-[#2a78d6]"
              aria-label="나이"
            />
          </Field>
          <Field label="가구 소득(중위소득 기준)">
            <select value={income ?? ""} onChange={(e) => set({ inc: e.target.value })} className="sel w-full" aria-label="소득">
              <option value="">모름</option>
              {INCOME_LABELS.map((l, i) => (
                <option key={l} value={i}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-[1.6fr_1fr]">
          <Field label="지금 상태">
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <Chip key={s.key || "none"} on={status === s.key} onClick={() => set({ st: s.key })}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="가구">
            <div className="flex flex-wrap gap-1.5">
              <Chip on={single} onClick={() => set({ single: single ? null : "1" })}>1인가구</Chip>
              <Chip on={noHouse} onClick={() => set({ nohouse: noHouse ? null : "1" })}>무주택</Chip>
              <Chip on={married} onClick={() => set({ married: married ? null : "1" })}>기혼</Chip>
            </div>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hair pt-4 text-[12px]">
          <span className="font-semibold text-ink-3">예시로 보기</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => router.replace(`?${new URLSearchParams(p.q).toString()}`, { scroll: false })}
              className="rounded-full border border-hair px-3 py-1 text-ink-2 hover:bg-wash"
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* summary: how the three ledgers split one person's options */}
      <section className="mt-8">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">
          {place?.sido} {place?.name} · 만 {age}세에게 보이는 것
        </h2>
        <p className="mt-2 max-w-[720px] text-[14px] leading-[1.8] text-ink-2">
          온통청년에서{" "}
          <b className="font-semibold text-ink">{on.length.toLocaleString("ko-KR")}건</b>
          {openOnly ? "(지금 신청 가능)" : ""}, 보조금24에서{" "}
          <b className="font-semibold text-ink">{g.length.toLocaleString("ko-KR")}건</b>
          {youthOnly ? "(청년 관련)" : ""}이 조건에 맞습니다. 두 곳에 모두 있는 것은{" "}
          <b className="font-semibold text-ink">{bothN}건</b>뿐이고, 이 지역 예산서에는 온통청년에 없는 청년 지원사업이{" "}
          <b className="font-semibold text-ink">{result.budget.length}건</b> 더 있습니다. 한 사람이 자기 몫을 알려면 창구 두 곳과 지자체 공고를 따로 뒤져야 합니다.
        </p>

        <div className="mt-5 rounded-[20px] border border-hair bg-card p-5">
          <div className="flex h-10 gap-[2px]" role="img" aria-label="세 장부별 건수">
            {[
              { k: "온통청년에만", v: onOnly, c: C_ON },
              { k: "둘 다", v: bothN, c: C_BOTH },
              { k: "보조금24에만", v: gOnly, c: C_G24 },
              { k: "예산서에만", v: result.budget.length, c: C_BUDGET },
            ]
              .filter((s) => s.v > 0)
              .map((s, i, arr) => (
                <span
                  key={s.k}
                  title={`${s.k} ${s.v}건`}
                  className="flex items-center justify-center overflow-hidden text-[12px] font-semibold text-white"
                  style={{
                    flexGrow: s.v / total,
                    flexBasis: 0,
                    background: s.c,
                    borderRadius: `${i === 0 ? 6 : 0}px ${i === arr.length - 1 ? 6 : 0}px ${i === arr.length - 1 ? 6 : 0}px ${i === 0 ? 6 : 0}px`,
                  }}
                >
                  {s.v / total > 0.07 ? s.v : ""}
                </span>
              ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-2">
            <Legend c={C_ON} t={`온통청년에만 ${onOnly}`} />
            <Legend c={C_BOTH} t={`둘 다 ${bothN}`} />
            <Legend c={C_G24} t={`보조금24에만 ${gOnly}`} />
            <Legend c={C_BUDGET} t={`예산서에만 ${result.budget.length}`} />
          </div>
          <div className="mt-4 grid gap-3 border-t border-hair pt-4 sm:grid-cols-3">
            <LocalStat c={C_ON} label="온통청년의 우리 지역 정책" v={localOn} />
            <LocalStat c={C_G24} label="보조금24의 우리 지역 서비스" v={localG} />
            <LocalStat c={C_BUDGET} label="예산서에만 있는 우리 지역 사업" v={result.budget.length} />
          </div>
          <p className="mt-2 text-[11.5px] text-ink-3">
            {place?.sido}·{place?.name}이 직접 운영하는 것만 셌습니다(전국 사업 제외).
            {localOn === 0 && localG + result.budget.length > 0 && " 온통청년만 봐서는 우리 지역 정책을 하나도 찾을 수 없습니다."}
          </p>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-hair pt-3 text-[12.5px]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
              온통청년: 지금 신청 가능한 것만
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={youthOnly} onChange={(e) => setYouthOnly(e.target.checked)} />
              보조금24: 청년 관련만
            </label>
          </div>
        </div>
      </section>

      {/* three lists */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <Column
          color={C_ON}
          title="온통청년"
          sub={`조건 충족 ${onClear.length} · 확인 필요 ${onCheck.length}`}
          more={shown.on < on.length ? () => setShown({ ...shown, on: shown.on + PAGE }) : undefined}
        >
          {on.slice(0, shown.on).map(({ item, check }) => (
            <Item
              key={item.id}
              title={item.n}
              meta={`${item.r.includes("ALL") ? "전국" : "지역"} · ${item.inst ?? ""} · ${item.s}`}
              badge={bothIds.has(item.id) ? { t: "보조금24에도", c: C_BOTH } : undefined}
              check={check}
              href={item.page ? `/notice/program/${item.id}` : undefined}
            />
          ))}
        </Column>
        <Column
          color={C_G24}
          title="보조금24"
          sub={`조건 충족 ${g.filter((x) => x.check.length === 0).length} · 확인 필요 ${g.filter((x) => x.check.length > 0).length} · 행정정보로 자격 판정`}
          more={shown.g < g.length ? () => setShown({ ...shown, g: shown.g + PAGE }) : undefined}
        >
          {g.slice(0, shown.g).map(({ item, check }) => (
            <Item
              key={item.id}
              title={item.n}
              meta={`${item.r === "ALL" ? "전국" : "지역"} · ${item.inst} · ${item.f} · ${item.k.split("||")[0]}`}
              check={check}
              ext={gov24Url(item.id)}
            />
          ))}
        </Column>
        <Column
          color={C_BUDGET}
          title="예산서에만"
          sub="온통청년에 없는 이 지역 청년 지원사업(자동 판정)"
          more={shown.b < result.budget.length ? () => setShown({ ...shown, b: shown.b + 10 }) : undefined}
        >
          {result.budget.slice(0, shown.b).map((b, i) => (
            <Item key={`${b.n}-${i}`} title={b.n} meta={`${b.org} · 예산현액 ${b.b.toLocaleString("ko-KR")}억 원`} href={`/fiscal/program/?id=${b.id}&r=${b.s}`} />
          ))}
          {result.budget.length === 0 && <p className="py-3 text-[12.5px] text-ink-3">해당 없음</p>}
        </Column>
      </section>

      {/* same person, every other place */}
      <section className="mt-14">
        <h2 className="text-[22px] font-bold tracking-[-0.025em]">같은 사람이 다른 곳에 산다면</h2>
        <p className="mt-2 max-w-[720px] text-[14px] leading-[1.8] text-ink-2">
          조건은 그대로 두고 사는 곳만 전국 {sweep.n}개 시·군·구로 옮겨, 조건이 분명히 맞는 정책 수(온통청년 지금 신청 가능 + 보조금24 청년 관련)를
          셌습니다. {place?.name}은 <b className="font-semibold text-ink">{sweep.mine}건</b>으로 {sweep.n}곳 가운데{" "}
          <b className="font-semibold text-ink">{sweep.rank}위</b>이고, 가장 많은 곳은 {sweep.top}건, 가장 적은 곳은 {sweep.min}건입니다.
        </p>
        <div className="mt-5 rounded-[20px] border border-hair bg-card p-6">
          <StripChart
            rows={sweep.rows}
            color={C_ON}
            max={sweep.max}
            format="count"
            tipLabel="조건이 맞는 정책"
            highlight={person.place}
            caption="점 하나가 시·군·구, 검은 점이 지금 고른 곳, 눈금이 광역 안의 중앙값입니다."
          />
        </div>
      </section>

      <p className="mt-12 border-t border-hair pt-5 text-[12px] leading-[1.8] text-ink-3">
        자동 판정입니다. 온통청년은 대상 지역·연령·혼인·취업상태로, 보조금24는 지원조건 코드(연령·소득 구간·대상 특성·가구)로 걸렀고, 문구로만 적힌
        조건(소득 기준 문장, 학력, 특화 대상)은 ‘확인 필요’로 남겼습니다. 온통청년의 ‘연령제한 여부’ 표시는 실제 연령값과 맞지 않는 경우가 많아(연령
        0~99999인데 제한 ‘예’ 709건) 숫자만 썼습니다. 실제 자격은 반드시 원문과 보조금24 자격 확인(로그인)으로 확인하세요.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-ink-3">{label}</p>
      {children}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
        on ? "border-ink bg-ink text-onink" : "border-hair bg-card text-ink-2 hover:bg-wash"
      }`}
    >
      {children}
    </button>
  );
}

function LocalStat({ c, label, v }: { c: string; label: string; v: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ background: c }} aria-hidden />
      <span className="text-[12.5px] text-ink-2">{label}</span>
      <span className="tnum ml-auto text-[20px] font-bold">{v}</span>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} aria-hidden />
      {t}
    </span>
  );
}

function Column({
  color,
  title,
  sub,
  more,
  children,
}: {
  color: string;
  title: string;
  sub: string;
  more?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-hair bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-[3px]" style={{ background: color }} aria-hidden />
        <h3 className="text-[16px] font-bold">{title}</h3>
      </div>
      <p className="mt-1 text-[12px] text-ink-3">{sub}</p>
      <ul className="mt-3 border-t border-hair">{children}</ul>
      {more && (
        <button onClick={more} className="mt-3 text-[12.5px] font-semibold text-ink-2 hover:text-ink">
          더 보기 →
        </button>
      )}
    </div>
  );
}

function Item({
  title,
  meta,
  badge,
  check,
  href,
  ext,
}: {
  title: string;
  meta: string;
  badge?: { t: string; c: string };
  check?: string[];
  href?: string;
  ext?: string;
}) {
  const body = (
    <>
      <span className="block text-[13.5px] leading-snug font-semibold">{title}</span>
      <span className="mt-0.5 block text-[11.5px] text-ink-3">{meta}</span>
      <span className="mt-1 flex flex-wrap gap-1">
        {badge && (
          <span className="rounded-[4px] px-1.5 py-0.5 text-[10.5px] font-semibold text-white" style={{ background: badge.c }}>
            {badge.t}
          </span>
        )}
        {check?.map((c) => (
          <span key={c} className="rounded-[4px] border border-hair px-1.5 py-0.5 text-[10.5px] text-ink-2">
            확인 필요 · {c}
          </span>
        ))}
      </span>
    </>
  );
  return (
    <li className="border-b border-hair py-2.5">
      {href ? (
        <Link href={href} className="block hover:underline">
          {body}
        </Link>
      ) : ext ? (
        <a href={ext} target="_blank" rel="noreferrer noopener" className="block hover:underline">
          {body}
        </a>
      ) : (
        body
      )}
    </li>
  );
}
