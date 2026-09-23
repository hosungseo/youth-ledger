"use client";

import { useState } from "react";
import type { Program } from "@/lib/types";
import ProgramTable, { type Sort } from "./ProgramTable";

/** The region page's list: same table as 목록, sortable in place. */
export default function RegionTable({ programs }: { programs: Program[] }) {
  const [sort, setSort] = useState<Sort>("budget");

  const sorted = [...programs].sort((a, b) => {
    if (sort === "budget") return (b.budget ?? -1) - (a.budget ?? -1);
    if (sort === "name") return a.name.localeCompare(b.name, "ko");
    return a.type.localeCompare(b.type, "ko") || (b.budget ?? 0) - (a.budget ?? 0);
  });

  return <ProgramTable programs={sorted} sort={sort} onSort={setSort} />;
}
