import { useState } from "react"
import { CircleAlert, Info, TriangleAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { BUDGET_RELEASED, PROVINCES, ROLES, type MapKey, type Province, type Source } from "@/data/demo"
import { fmtK, fmtN } from "@/lib/format"
import { provById, scopeLabel, scopeProvinces, scopeTotals } from "@/lib/scope"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const MAPK: Record<MapKey, { label: string; fmt: (v: number) => string; src: string }> = {
  farmers: { label: "Registered farmers", fmt: fmtK, src: "ziamis" },
  delivery: { label: "Input delivery", fmt: (v) => v + "%", src: "ziamis" },
  rain: { label: "Rainfall", fmt: (v) => v + "%", src: "zmd" },
  fra: { label: "FRA purchases", fmt: (v) => fmtK(v) + " t", src: "fra" },
}

const SCALE = ["--scale-1", "--scale-2", "--scale-3", "--scale-4", "--scale-5"]

function scaleIndex(k: MapKey, v: number) {
  const vals = PROVINCES.map((p) => p[k])
  const mn = Math.min(...vals)
  const mx = Math.max(...vals)
  return Math.min(4, Math.floor(((v - mn) / (mx - mn || 1)) * 5))
}

const belowThreshold = (k: MapKey, p: Province) => (k === "rain" && p.rain < 80) || (k === "delivery" && p.delivery < 70)

export function Overview() {
  const { role, prov, sources } = useStore()
  const r = ROLES[role]
  const [sel, setSel] = useState<string | null>(null)
  // Provincial and district users always look at their own province.
  const selected = r.scope === "national" ? sel : prov
  const t = scopeTotals(role, prov)
  const src = (id: string) => sources.find((s) => s.id === id)!

  const kpis: [label: string, value: string | null, unit: string, source: Source][] = [
    ["Registered farmers", fmtN(t.farmers), "", src("ziamis")],
    ["Input delivery rate", String(t.delivery), "%", src("ziamis")],
    ["Rainfall against normal", String(t.rain), "%", src("zmd")],
    ["FRA maize purchased", fmtK(t.fra), "t", src("fra")],
    ["Maize price, 50 kg", String(t.price), "ZMW", src("zamstats")],
    ["Budget released", r.budget ? String(BUDGET_RELEASED) : null, "%", src("mof")],
  ]

  return (
    <section aria-labelledby="h-ov" className="space-y-6">
      <div>
        <h1 id="h-ov" className="text-3xl font-semibold tracking-tight text-primary">
          Season 2026/27 at a glance
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          {scopeLabel(role, prov)} view for the {r.name}. Every number shows which agency it came from and how fresh it is.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([label, value, unit, s]) => (
          <Card key={label} size="sm" className="gap-2 border-t-4 border-t-primary">
            <CardContent className="flex h-full flex-col gap-1">
              <div className="text-sm font-semibold">{label}</div>
              {value === null ? (
                <div className="text-sm text-muted-foreground">Visible to Executive and HQ roles only</div>
              ) : (
                <div className="text-3xl font-semibold tabular-nums text-primary">
                  {value}
                  {unit && <small className="ml-1 text-base font-normal text-muted-foreground">{unit}</small>}
                </div>
              )}
              <div className="mt-auto border-t border-dashed pt-2 text-xs text-muted-foreground">
                <span
                  className={cn("mr-1.5 inline-block size-2 rounded-full align-middle", s.stale ? "bg-warning" : "bg-primary")}
                />
                {s.short}, {s.stale ? "out of date since " : "updated "}
                {s.upd}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <ProvinceMap selected={selected} onSelect={setSel} />
        <div className="flex flex-col gap-6">
          <Alerts />
          <ProvinceDetail id={selected} />
        </div>
      </div>
    </section>
  )
}

function ProvinceMap({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const { role, prov, mapk, setMapk, sources } = useStore()
  const national = ROLES[role].scope === "national"
  const W = 122, H = 100, G = 8, OX = 8, OY = 6
  const meta = MAPK[mapk]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Provinces</CardTitle>
        <CardDescription>Schematic tile map: each province is one tile placed roughly where it lies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ToggleGroup
          type="single"
          variant="outline"
          value={mapk}
          onValueChange={(v) => v && setMapk(v as MapKey)}
          aria-label="Map indicator"
          className="flex-wrap"
        >
          {(Object.keys(MAPK) as MapKey[]).map((k) => (
            <ToggleGroupItem
              key={k}
              value={k}
              className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              {MAPK[k].label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <svg viewBox="0 0 520 330" className="w-full" role="img" aria-label="Schematic tile map of Zambia's ten provinces">
          {PROVINCES.map((p) => {
            const inScope = national || p.id === prov
            const i = scaleIndex(mapk, p[mapk])
            const x = OX + p.x * (W + G)
            const y = OY + p.y * (H + G)
            const fg = i >= 3 ? "var(--primary-foreground)" : "var(--foreground)"
            const pick = () => inScope && onSelect(p.id)
            return (
              <g
                key={p.id}
                role="button"
                tabIndex={inScope ? 0 : -1}
                aria-label={`${p.name}: ${meta.label} ${meta.fmt(p[mapk])}`}
                className={cn(
                  "cursor-pointer outline-none transition-opacity hover:opacity-85 focus-visible:opacity-85",
                  !inScope && "cursor-default opacity-30",
                )}
                onClick={pick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    pick()
                  }
                }}
              >
                <rect
                  x={x}
                  y={y}
                  width={W}
                  height={H}
                  rx={8}
                  fill={`var(${SCALE[i]})`}
                  stroke={selected === p.id ? "var(--accent)" : "none"}
                  strokeWidth={5}
                />
                <text x={x + 12} y={y + 28} fill={fg} fontSize={15}>
                  {p.short}
                </text>
                <text x={x + 12} y={y + 72} fill={fg} fontSize={28} fontWeight={600}>
                  {meta.fmt(p[mapk])}
                </text>
                {belowThreshold(mapk, p) && <circle cx={x + W - 16} cy={y + 18} r={7} fill="var(--warning)" stroke="var(--card)" strokeWidth={2} />}
              </g>
            )
          })}
        </svg>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          Lower
          {SCALE.map((s) => (
            <i key={s} className="inline-block h-2.5 w-6 rounded-sm" style={{ background: `var(${s})` }} />
          ))}
          Higher
          {(mapk === "rain" || mapk === "delivery") && (
            <span className="ml-3 inline-flex items-center gap-1">
              <i className="inline-block size-2.5 rounded-full bg-warning" /> Below alert threshold
            </span>
          )}
          <span className="ml-3">Source: {sources.find((s) => s.id === meta.src)!.agency}</span>
        </div>
      </CardContent>
    </Card>
  )
}

type AlertItem = { kind: "risk" | "warn" | "info"; title: string; msg: string }

function Alerts() {
  const { role, prov, sources } = useStore()
  const list = scopeProvinces(role, prov)
  const src = (id: string) => sources.find((s) => s.id === id)!
  const out: AlertItem[] = []
  list
    .filter((p) => p.rain < 80)
    .sort((a, b) => a.rain - b.rain)
    .forEach((p) =>
      out.push({ kind: "risk", title: `Rainfall at ${p.rain}% of normal in ${p.name}`, msg: `ZMD bulletin, ${src("zmd").upd}. Alert threshold: 80%.` }),
    )
  list
    .filter((p) => p.delivery < 70)
    .sort((a, b) => a.delivery - b.delivery)
    .forEach((p) =>
      out.push({ kind: "warn", title: `Input delivery at ${p.delivery}% in ${p.name}`, msg: `ZIAMIS e-voucher, ${src("ziamis").upd}. Alert threshold: 70%.` }),
    )
  sources
    .filter((s) => s.stale && s.run)
    .forEach((s) => out.push({ kind: "warn", title: `${s.agency} data is out of date`, msg: `Last received ${s.upd}. The data steward has been reminded.` }))
  if (ROLES[role].scope === "national") {
    const n = sources.filter((s) => s.dsa === "no").length
    if (n) out.push({ kind: "info", title: `${n} data-sharing agreement${n === 1 ? "" : "s"} not yet started`, msg: "Track progress in Data sources." })
  }
  if (!out.length) out.push({ kind: "info", title: "Nothing needs attention in this scope", msg: "All indicators are within their thresholds." })

  const style = {
    risk: { cls: "border-l-destructive", Icon: CircleAlert, icon: "text-destructive" },
    warn: { cls: "border-l-warning", Icon: TriangleAlert, icon: "text-warning" },
    info: { cls: "border-l-primary", Icon: Info, icon: "text-primary" },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Needs attention</CardTitle>
        <CardAction className="text-sm text-muted-foreground">{out.length}</CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {out.map((a) => {
            const { cls, Icon, icon } = style[a.kind]
            return (
              <li key={a.title} className={cn("flex gap-2.5 rounded-r-md border-l-4 bg-muted/60 px-3 py-2.5", cls)}>
                <Icon className={cn("mt-0.5 size-4 shrink-0", icon)} />
                <div>
                  <div className="font-semibold">{a.title}</div>
                  <div className="text-sm text-muted-foreground">{a.msg}</div>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
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
  const rows: [string, string][] = [
    ["Registered farmers", fmtN(p.farmers)],
    ["Women among farmers", p.women + "%"],
    ["Input delivery rate", p.delivery + "%"],
    ["Rainfall against normal", p.rain + "%"],
    ["FRA maize purchased", fmtN(p.fra) + " t"],
    ["Maize price, 50 kg", "ZMW " + p.price],
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{p.name} Province</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
          {rows.map(([a, b]) => (
            <div key={a} className="contents">
              <dt className="text-muted-foreground">{a}</dt>
              <dd className="text-right font-semibold tabular-nums">{b}</dd>
            </div>
          ))}
        </dl>
        <Separator className="my-3" />
        <p className="text-sm text-muted-foreground">Individual farmer records are never shown. Figures are totals or rates.</p>
      </CardContent>
    </Card>
  )
}
