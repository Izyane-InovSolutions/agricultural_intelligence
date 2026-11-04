import type { Source } from "@/data/demo"

// Synthetic examples of records that failed a quality rule, for the "records held" drill-down.

export type HeldRecord = { id: string; field: string; value: string; rule: string; status: "Sent to steward" | "Corrected" }

const RULES: Record<string, { prefix: string; field: string; rule: string; values: string[] }> = {
  ziamis: { prefix: "ZF", field: "district_code", rule: "District code not in the reference list", values: ["KBW-09", "CHP-2", "MNG01", "LVG-11", "ISK-0", "SRN-7"] },
  fra: { prefix: "FRA-D", field: "depot_code", rule: "Depot code missing", values: [""] },
  mgee: { prefix: "CSA", field: "season", rule: "Season label not in the agreed calendar", values: ["2026", "26/27", "2026-2027", "Season 2026", "2025/26 late"] },
}

const SAMPLE_SIZE = 12

export function heldRecords(src: Source): HeldRecord[] {
  const r = RULES[src.id]
  if (!r || !src.run) return []
  const held = src.run[0] - src.run[1]
  return Array.from({ length: Math.min(SAMPLE_SIZE, held) }, (_, i) => ({
    id: `${r.prefix}-${String(104729 + i * 7919).padStart(7, "0")}`,
    field: r.field,
    value: r.values[i % r.values.length],
    rule: r.rule,
    // A few have already been fixed upstream, to show the loop closing.
    status: i % 5 === 3 ? "Corrected" : "Sent to steward",
  }))
}
