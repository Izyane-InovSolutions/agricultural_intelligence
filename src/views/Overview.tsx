import { lazy, Suspense, useState } from "react"
import { ChevronRight, Lock } from "lucide-react"
import { AlertsPanel } from "@/components/AlertsPanel"
import { Change } from "@/components/Change"
import { ProvinceMap } from "@/components/ProvinceMap"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PROVINCES, ROLES } from "@/data/demo"
import { lastSeasonValue, trend, type KpiId } from "@/data/trends"
import { KPIS } from "@/lib/kpis"
import { aggregate, provById, scopeLabel, scopeTotals } from "@/lib/scope"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

// The trend chart library is large, so it only downloads when someone opens a figure.
const KpiSheet = lazy(() => import("@/components/KpiSheet"))

export function Overview() {
  const { role, prov, sources } = useStore()
  const r = ROLES[role]
  const [sel, setSel] = useState<string | null>(null)
  const [openKpi, setOpenKpi] = useState<KpiId | null>(null)
  // Provincial and district users always look at their own province.
  const selected = r.scope === "national" ? sel : prov
  const t = scopeTotals(role, prov)

  return (
    <section aria-labelledby="h-ov" className="space-y-6">
      <div>
        <h1 id="h-ov" className="text-3xl font-semibold tracking-tight text-primary">
          Season 2026/27 at a glance
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          {scopeLabel(role, prov)} view for the {r.name}. Every number shows which agency it came from and how fresh it is. Select a
          figure to see its trend, definition and provincial breakdown.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {KPIS.map((k) => {
          const s = sources.find((x) => x.id === k.sourceId)!
          const locked = k.executiveOnly && !r.budget
          const v = k.value(t)
          return (
            <Card
              key={k.id}
              size="sm"
              className={cn(
                "gap-2 border-t-4 border-t-primary transition-shadow",
                !locked && "cursor-pointer hover:shadow-md focus-within:ring-2 focus-within:ring-ring",
              )}
            >
              <CardContent className="flex h-full flex-col gap-1">
                {locked ? (
                  <>
                    <div className="text-sm font-semibold">{k.label}</div>
                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Lock className="mt-0.5 size-3.5 shrink-0" /> Visible to Executive and HQ roles only
                    </div>
                  </>
                ) : (
                  <button type="button" onClick={() => setOpenKpi(k.id)} className="flex flex-col gap-1 text-left outline-none">
                    <span className="flex items-center justify-between gap-1 text-sm font-semibold">
                      {k.label}
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </span>
                    <span className="text-3xl font-semibold tabular-nums text-primary">
                      {k.short(v)}
                      {k.unit && <small className="ml-1 text-base font-normal text-muted-foreground">{k.unit}</small>}
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <Sparkline kpi={k.id} value={v} />
                      <span className="text-right leading-tight">
                        <Change now={v} before={lastSeasonValue(k.id, v)} higherIsBetter={k.higherIsBetter} />
                        <span className="block text-[11px] text-muted-foreground">vs last season</span>
                      </span>
                    </span>
                  </button>
                )}
                <div className="mt-auto border-t border-dashed pt-2 text-xs text-muted-foreground">
                  <span className={cn("mr-1.5 inline-block size-2 rounded-full align-middle", s.stale ? "bg-warning" : "bg-primary")} />
                  {s.short}, {s.stale ? "out of date since " : "updated "}
                  {s.upd}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <ProvinceMap selected={selected} onSelect={setSel} />
        <div className="flex flex-col gap-6">
          <AlertsPanel />
          <ProvinceDetail id={selected} />
        </div>
      </div>

      {openKpi && (
        <Suspense>
          <KpiSheet kpiId={openKpi} onClose={() => setOpenKpi(null)} />
        </Suspense>
      )}
    </section>
  )
}

function Sparkline({ kpi, value }: { kpi: KpiId; value: number }) {
  const pts = trend(kpi, value)
    .map((p, i) => [i, p.current] as const)
    .filter((p): p is readonly [number, number] => p[1] !== null)
  const ys = pts.map((p) => p[1])
  const mn = Math.min(...ys)
  const mx = Math.max(...ys)
  const W = 72
  const H = 24
  const x = (i: number) => (i / 5) * (W - 4) + 2
  const y = (v: number) => H - 3 - ((v - mn) / (mx - mn || 1)) * (H - 6)
  const last = pts[pts.length - 1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden className="shrink-0">
      <polyline points={pts.map(([i, v]) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke="var(--primary)" strokeWidth={1.75} strokeLinejoin="round" />
      <circle cx={x(last[0])} cy={y(last[1])} r={2.5} fill="var(--accent)" />
    </svg>
  )
}

function ProvinceDetail({ id }: { id: string | null }) {
  if (!id)
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Province detail</CardTitle>
          <CardDescription>Select a province on the map to see all of its indicators side by side.</CardDescription>
        </CardHeader>
      </Card>
    )
  const p = provById(id)
  const nat = aggregate(PROVINCES)
  const rows = KPIS.filter((k) => k.province)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{p.name} Province</CardTitle>
        <CardDescription>Compared with the national picture.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-4 gap-y-2">
          <dt className="text-xs text-muted-foreground" />
          <dd className="text-right text-xs text-muted-foreground">Province</dd>
          <dd className="text-right text-xs text-muted-foreground">National</dd>
          <DetailRow label="Women among farmers" value={p.women + "%"} national={nat.women + "%"} />
          {rows.map((k) => {
            const v = k.province!(p)
            const n = k.value(nat)
            return (
              <DetailRow
                key={k.id}
                label={k.label}
                value={k.full(v)}
                national={k.count ? `${Math.round((v / n) * 100)}% of national` : k.full(n)}
                worse={!k.count && (k.higherIsBetter ? v < n : v > n)}
              />
            )
          })}
        </dl>
        <Separator className="my-3" />
        <p className="text-sm text-muted-foreground">Individual farmer records are never shown. Figures are totals or rates.</p>
      </CardContent>
    </Card>
  )
}

function DetailRow({ label, value, national, worse }: { label: string; value: string; national: string; worse?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("text-right font-semibold tabular-nums", worse && "text-warning")}>{value}</dd>
      <dd className="text-right text-sm text-muted-foreground tabular-nums">{national}</dd>
    </>
  )
}
