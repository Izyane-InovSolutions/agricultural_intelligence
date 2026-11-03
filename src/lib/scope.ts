import { PROVINCES, ROLES, type Province, type RoleId } from "@/data/demo"

export const provById = (id: string) => PROVINCES.find((p) => p.id === id) ?? PROVINCES[0]

export type Totals = { farmers: number; women: number; delivery: number; rain: number; fra: number; price: number }

export function aggregate(list: Province[]): Totals {
  const farmers = list.reduce((a, p) => a + p.farmers, 0)
  const weighted = (k: "women" | "delivery") => Math.round(list.reduce((a, p) => a + p[k] * p.farmers, 0) / farmers)
  const mean = (k: "rain" | "price") => Math.round(list.reduce((a, p) => a + p[k], 0) / list.length)
  return {
    farmers,
    women: weighted("women"),
    delivery: weighted("delivery"),
    rain: mean("rain"),
    fra: list.reduce((a, p) => a + p.fra, 0),
    price: mean("price"),
  }
}

export function scopeProvinces(role: RoleId, prov: string) {
  return ROLES[role].scope === "national" ? PROVINCES : [provById(prov)]
}

export function scopeTotals(role: RoleId, prov: string): Totals {
  const t = aggregate(scopeProvinces(role, prov))
  // The district view is a fixed demo slice of its province.
  if (ROLES[role].scope === "district") {
    t.farmers = Math.round(t.farmers * 0.18)
    t.fra = Math.round(t.fra * 0.21)
  }
  return t
}

export function scopeLabel(role: RoleId, prov: string) {
  const scope = ROLES[role].scope
  if (scope === "national") return "National"
  const p = provById(prov)
  return scope === "district" ? `Kabwe District, ${p.name} (district view)` : `${p.name} Province`
}
