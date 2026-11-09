import { PROVINCES, ROLES, type Area, type RoleId } from "@/data/demo"
import { DISTRICTS } from "@/data/districts"

export const provById = (id: string) => PROVINCES.find((p) => p.id === id) ?? PROVINCES[0]

export const districtsOf = (prov: string) => DISTRICTS.filter((d) => d.prov === prov)

// The district if it is in the province, otherwise the province's first district.
export function districtIn(prov: string, dist: string) {
  const list = districtsOf(prov)
  return list.find((d) => d.id === dist) ?? list[0]
}

export type Totals = { farmers: number; women: number; delivery: number; rain: number; fra: number; price: number }

export function aggregate(list: Area[]): Totals {
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

// The areas a role's figures cover: every province, one province, or one district.
export function scopeAreas(role: RoleId, prov: string, dist: string): Area[] {
  const scope = ROLES[role].scope
  if (scope === "national") return PROVINCES
  if (scope === "district") return [districtIn(prov, dist)]
  return [provById(prov)]
}

export const scopeTotals = (role: RoleId, prov: string, dist: string): Totals => aggregate(scopeAreas(role, prov, dist))

export function scopeLabel(role: RoleId, prov: string, dist: string) {
  const scope = ROLES[role].scope
  if (scope === "national") return "National"
  const p = provById(prov)
  return scope === "district" ? `${districtIn(prov, dist).name} District, ${p.name} Province` : `${p.name} Province`
}
