import { BUDGET_RELEASED, type Province } from "@/data/demo"
import type { KpiId } from "@/data/trends"
import { fmtK, fmtN } from "@/lib/format"
import type { Totals } from "@/lib/scope"

export type Kpi = {
  id: KpiId
  label: string
  // Name of the matching entry in the indicator dictionary.
  indicator: string
  sourceId: string
  unit: string
  // Display format: compact for cards and map tiles, full for tables.
  short: (v: number) => string
  full: (v: number) => string
  value: (t: Totals) => number
  province?: (p: Province) => number
  // Which direction is good news, for colouring changes.
  higherIsBetter: boolean
  // Counts add up across provinces; rates and prices are averaged.
  count?: boolean
  executiveOnly?: boolean
}

const pct = (v: number) => v + "%"

export const KPIS: Kpi[] = [
  { id: "farmers", label: "Registered farmers", indicator: "Registered farmers", sourceId: "ziamis", unit: "", short: fmtN, full: fmtN, value: (t) => t.farmers, province: (p) => p.farmers, higherIsBetter: true, count: true },
  { id: "delivery", label: "Input delivery rate", indicator: "Input delivery rate", sourceId: "ziamis", unit: "%", short: String, full: pct, value: (t) => t.delivery, province: (p) => p.delivery, higherIsBetter: true },
  { id: "rain", label: "Rainfall against normal", indicator: "Rainfall against normal", sourceId: "zmd", unit: "%", short: String, full: pct, value: (t) => t.rain, province: (p) => p.rain, higherIsBetter: true },
  { id: "fra", label: "FRA maize purchased", indicator: "FRA maize purchases", sourceId: "fra", unit: "t", short: fmtK, full: (v) => fmtN(v) + " t", value: (t) => t.fra, province: (p) => p.fra, higherIsBetter: true, count: true },
  { id: "price", label: "Maize price, 50 kg", indicator: "Average maize grain price", sourceId: "zamstats", unit: "ZMW", short: String, full: (v) => "ZMW " + v, value: (t) => t.price, province: (p) => p.price, higherIsBetter: false },
  { id: "budget", label: "Budget released", indicator: "Programme budget released", sourceId: "mof", unit: "%", short: String, full: pct, value: () => BUDGET_RELEASED, higherIsBetter: true, executiveOnly: true },
]

export const kpiById = (id: KpiId) => KPIS.find((k) => k.id === id)!

// Change against last season, as a signed percentage.
export function changePct(now: number, before: number) {
  return before ? Math.round(((now - before) / before) * 100) : 0
}
