import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { BookOpen } from "lucide-react"
import { Change } from "@/components/Change"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { INDICATORS, PROVINCES, ROLES } from "@/data/demo"
import { lastSeasonValue, trend, type KpiId } from "@/data/trends"
import { kpiById } from "@/lib/kpis"
import { aggregate, districtIn, districtsOf, provById, scopeLabel, scopeTotals } from "@/lib/scope"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

const chartConfig = {
  current: { label: "2026/27 season", color: "var(--primary)" },
  previous: { label: "2025/26 season", color: "var(--accent)" },
} satisfies ChartConfig

export default function KpiSheet({ kpiId, onClose }: { kpiId: KpiId | null; onClose: () => void }) {
  const { role, prov, dist, sources } = useStore()
  const kpi = kpiId ? kpiById(kpiId) : null

  return (
    <Sheet open={!!kpi} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-xl">
        {kpi && <KpiDetail kpiId={kpi.id} role={role} prov={prov} dist={dist} sources={sources} />}
      </SheetContent>
    </Sheet>
  )
}

function KpiDetail({ kpiId, role, prov, dist, sources }: { kpiId: KpiId } & Pick<ReturnType<typeof useStore>, "role" | "prov" | "dist" | "sources">) {
  const kpi = kpiById(kpiId)
  const ind = INDICATORS.find((i) => i.name === kpi.indicator)!
  const src = sources.find((s) => s.id === kpi.sourceId)!
  const now = kpi.value(scopeTotals(role, prov, dist))
  const data = trend(kpi.id, now)
  const before = lastSeasonValue(kpi.id, now)
  const national = kpi.value(aggregate(PROVINCES))
  const r = ROLES[role]
  const provinces = r.scope === "national" ? PROVINCES : PROVINCES.filter((p) => p.id === prov)
  // District users compare districts within their province, never provincial totals.
  const district = r.scope === "district"
  const own = districtIn(prov, dist).id

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-xl text-primary">{kpi.label}</SheetTitle>
        <SheetDescription>{scopeLabel(role, prov, dist)}</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 px-4 pb-6">
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-4xl font-semibold tabular-nums text-primary">{kpi.full(now)}</span>
          <span className="pb-1 text-sm text-muted-foreground">
            <Change now={now} before={before} higherIsBetter={kpi.higherIsBetter} /> against {kpi.full(before)} at this point last season
          </span>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">This season against last</h3>
          <ChartContainer config={chartConfig} className="aspect-[16/9] w-full">
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => kpi.short(v)} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="previous" stroke="var(--color-previous)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls={false} animationDuration={500} />
              <Line dataKey="current" stroke="var(--color-current)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} animationDuration={500} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-semibold">
            <BookOpen className="size-4 text-primary" /> Definition
          </h3>
          <p>{ind.definition}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Source</dt>
            <dd>
              {src.agency}, {src.sys}
            </dd>
            <dt className="text-muted-foreground">Last update</dt>
            <dd>
              {src.upd}{" "}
              {src.stale && (
                <Badge variant="outline" className="ml-1 border-warning/40 bg-warning/10 text-warning">
                  Out of date
                </Badge>
              )}
            </dd>
            <dt className="text-muted-foreground">How often</dt>
            <dd>{ind.frequency}</dd>
            <dt className="text-muted-foreground">Steward</dt>
            <dd>{ind.steward}</dd>
          </dl>
          <a href="#indicators" className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
            Open the indicator dictionary
          </a>
        </div>

        {kpi.province && district && (
          <div>
            <h3 className="mb-2 font-semibold">Districts in {provById(prov).name} Province</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>District</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Rank</TableHead>
                  <TableHead className="text-right">Vs last season</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...districtsOf(prov)]
                  .sort((a, b) => (kpi.higherIsBetter ? kpi.province!(b) - kpi.province!(a) : kpi.province!(a) - kpi.province!(b)))
                  .map((d, i, list) => {
                    const v = kpi.province!(d)
                    return (
                      <TableRow key={d.id} className={cn(d.id === own && "bg-accent/10 font-semibold")}>
                        <TableCell>
                          {d.name}
                          {d.id === own && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(yours)</span>}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{kpi.full(v)}</TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {i + 1} of {list.length}
                        </TableCell>
                        <TableCell className="text-right">
                          <Change now={v} before={lastSeasonValue(kpi.id, v)} higherIsBetter={kpi.higherIsBetter} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              Individual farmer records are never shown. Figures are totals or rates.
            </p>
          </div>
        )}

        {kpi.province && !district && (
          <div>
            <h3 className="mb-2 font-semibold">By province</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Province</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">{kpi.count ? "Share of national" : "National average"}</TableHead>
                  <TableHead className="text-right">Vs last season</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {provinces.map((p) => {
                  const v = kpi.province!(p)
                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{kpi.full(v)}</TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {kpi.count ? Math.round((v / national) * 100) + "%" : kpi.full(national)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Change now={v} before={lastSeasonValue(kpi.id, v)} higherIsBetter={kpi.higherIsBetter} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <p className="mt-2 text-xs text-muted-foreground">
              Individual farmer records are never shown. Figures are totals or rates.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
