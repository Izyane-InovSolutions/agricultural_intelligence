// Synthetic monthly history for each headline indicator. The last point always equals
// the current figure, so charts and KPI cards agree.

export type KpiId = "farmers" | "delivery" | "rain" | "fra" | "price" | "budget"

export const MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]

// Share of the current figure reached in each month (null = not reported yet that month).
const SHAPE: Record<KpiId, (number | null)[]> = {
  farmers: [0.62, 0.71, 0.8, 0.88, 0.95, 1],
  delivery: [null, null, 0.1, 0.38, 0.72, 1],
  rain: [null, null, null, null, 1.14, 1],
  fra: [0.28, 0.55, 0.76, 0.9, 0.98, 1],
  price: [0.85, 0.87, 0.9, 0.93, 0.97, 1],
  budget: [0.55, 0.64, 0.73, 0.82, 0.91, 1],
}

// Last season at the same point, relative to this season.
const LAST_SEASON: Record<KpiId, number> = {
  farmers: 0.93,
  delivery: 0.88,
  rain: 1.09,
  fra: 1.16,
  price: 0.82,
  budget: 0.95,
}

export type TrendPoint = { month: string; current: number | null; previous: number | null }

export function trend(kpi: KpiId, current: number): TrendPoint[] {
  return MONTHS.map((month, i) => {
    const f = SHAPE[kpi][i]
    if (f === null) return { month, current: null, previous: null }
    // A small fixed wobble keeps last season from being a scaled copy of this one.
    const wobble = 1 + 0.03 * Math.sin(i * 2.1 + kpi.length)
    return {
      month,
      current: i === MONTHS.length - 1 ? current : Math.round(current * f),
      previous: Math.round(current * f * LAST_SEASON[kpi] * wobble),
    }
  })
}

export function lastSeasonValue(kpi: KpiId, current: number) {
  const pts = trend(kpi, current)
  return pts[pts.length - 1].previous ?? current
}
