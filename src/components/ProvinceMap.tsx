import { useEffect, useRef, useState } from "react"
import { Map as MapIcon, Table2 } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PROVINCES, ROLES, type MapKey, type Province } from "@/data/demo"
import { MAP_VIEWBOX, PROVINCE_SHAPES } from "@/data/zambia-map"
import { fmtK } from "@/lib/format"
import { kpiById } from "@/lib/kpis"
import { aggregate, provById } from "@/lib/scope"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const MAP_KEYS: MapKey[] = ["farmers", "delivery", "rain", "fra"]
const SHORT_LABEL: Record<MapKey, string> = { farmers: "Registered farmers", delivery: "Input delivery", rain: "Rainfall", fra: "FRA purchases" }
// Moves labels off borders where a province's centre point sits awkwardly.
const LABEL_NUDGE: Record<string, [number, number]> = { eastern: [-8, 22], luapula: [-4, 6] }
const SCALE = ["--scale-1", "--scale-2", "--scale-3", "--scale-4", "--scale-5"]
// Thresholds below which a province raises an alert.
const THRESHOLD: Partial<Record<MapKey, number>> = { delivery: 70, rain: 80 }

const fmtTile = (k: MapKey, v: number) => (k === "farmers" ? fmtK(v) : k === "fra" ? fmtK(v) + " t" : v + "%")

function scaleIndex(k: MapKey, v: number) {
  const vals = PROVINCES.map((p) => p[k])
  const mn = Math.min(...vals)
  const mx = Math.max(...vals)
  return Math.min(4, Math.floor(((v - mn) / (mx - mn || 1)) * 5))
}

const below = (k: MapKey, p: Province) => THRESHOLD[k] !== undefined && p[k] < THRESHOLD[k]!

export function ProvinceMap({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const { role, prov, mapk, setMapk, mapView, setMapView, sources } = useStore()
  const national = ROLES[role].scope === "national"
  const kpi = kpiById(mapk)
  const nat = kpi.value(aggregate(PROVINCES))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Provinces</CardTitle>
        <CardDescription>
          {mapView === "map" ? "Select a province to see its figures." : "The same figures as a table, compared with the national picture."}
        </CardDescription>
        <CardAction>
          <ToggleGroup type="single" variant="outline" size="sm" value={mapView} onValueChange={(v) => v && setMapView(v as "map" | "table")}>
            <ToggleGroupItem value="map" aria-label="Map view">
              <MapIcon /> <span className="hidden sm:inline">Map</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <Table2 /> <span className="hidden sm:inline">Table</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
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
          {MAP_KEYS.map((k) => (
            <ToggleGroupItem key={k} value={k} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {SHORT_LABEL[k]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {mapView === "map" ? (
          <>
            <Map3D selected={selected} onSelect={onSelect} national={national} prov={prov} mapk={mapk} />
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              Lower
              {SCALE.map((s) => (
                <i key={s} className="inline-block h-2.5 w-6 rounded-sm" style={{ background: `var(${s})` }} />
              ))}
              Higher
              {THRESHOLD[mapk] !== undefined && (
                <span className="ml-3 inline-flex items-center gap-1">
                  <i className="inline-block size-2.5 rounded-full bg-warning" /> Below {THRESHOLD[mapk]}% alert threshold
                </span>
              )}
            </div>
          </>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Province</TableHead>
                <TableHead className="text-right">{SHORT_LABEL[mapk]}</TableHead>
                <TableHead className="text-right">{kpi.count ? "Share of national" : "National average"}</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...PROVINCES]
                .filter((p) => national || p.id === prov)
                .sort((a, b) => b[mapk] - a[mapk])
                .map((p) => (
                  <TableRow
                    key={p.id}
                    onClick={() => onSelect(p.id)}
                    className={cn("cursor-pointer", selected === p.id && "bg-accent/10")}
                  >
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{kpi.full(p[mapk])}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {kpi.count ? Math.round((p[mapk] / nat) * 100) + "%" : kpi.full(nat)}
                    </TableCell>
                    <TableCell>
                      {below(mapk, p) ? (
                        <span className="font-medium text-warning">Below threshold</span>
                      ) : (
                        <span className="text-muted-foreground">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
        <p className="text-xs text-muted-foreground">
          Source: {sources.find((s) => s.id === kpi.sourceId)!.agency}. Boundaries: geoBoundaries / Zambia Data Hub (CC BY 4.0).
        </p>
      </CardContent>
    </Card>
  )
}

// Height of each province's side wall, in map units.
const DEPTH = 7
const [VB_X, VB_Y, VB_W, VB_H] = MAP_VIEWBOX.split(" ").map(Number)
// Extra room above for lifted provinces and below for the walls.
const VIEWBOX_3D = `${VB_X} ${VB_Y - 14} ${VB_W} ${VB_H + 14 + DEPTH + 4}`

type MapProps = { selected: string | null; onSelect: (id: string) => void; national: boolean; prov: string; mapk: MapKey }

function Map3D({ selected, onSelect, national, prov, mapk }: MapProps) {
  const [hover, setHover] = useState<string | null>(null)
  const [landing, setLanding] = useState<string | null>(null)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const inScope = (id: string) => national || id === prov
  const point = (id: string | null) => {
    if (id === hover) return
    // Let the previous province settle back down before it disappears from the top layer.
    if (hover && hover !== selected) {
      setLanding(hover)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setLanding(null), 170)
    }
    setHover(id && inScope(id) ? id : null)
  }
  // Hit-testing goes through data-prov so the lifted copy and the base shape count as one province.
  const provAt = (t: EventTarget) => (t as Element).closest?.("[data-prov]")?.getAttribute("data-prov") ?? null

  const lifted = [...new Set([selected, hover].filter((x): x is string => !!x))]
  const raised = new Set([...lifted, landing])
  const fill = (p: Province) => `var(${SCALE[scaleIndex(mapk, p[mapk])]})`
  const wall = (p: Province) => `color-mix(in oklch, ${fill(p)}, black 30%)`
  const walls = (p: Province) =>
    Array.from({ length: DEPTH }, (_, i) => (
      <path key={i} d={PROVINCE_SHAPES[p.id].d} transform={`translate(0 ${DEPTH - i})`} style={{ fill: wall(p) }} />
    ))

  return (
    <div className="mx-auto w-full max-w-xl [perspective:1600px]">
      <svg
        viewBox={VIEWBOX_3D}
        className="w-full origin-bottom [transform:rotateX(22deg)]"
        role="group"
        aria-label="Map of Zambia's ten provinces"
        onPointerMove={(e) => point(provAt(e.target))}
        onPointerLeave={() => point(null)}
        onClick={(e) => {
          // The lifted copy can appear between press and release, which sends the click to the svg itself.
          const id = provAt(e.target) ?? hover
          if (id && inScope(id)) onSelect(id)
        }}
      >
        <defs>
          <filter id="map-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Walls first, then every top face, so no wall covers a neighbour's top. */}
        {PROVINCES.map((p) => (
          <g key={p.id} data-prov={p.id} className={cn(!inScope(p.id) && "opacity-25")}>
            {walls(p)}
          </g>
        ))}
        {PROVINCES.map((p) => (
          <path
            key={p.id}
            data-prov={p.id}
            d={PROVINCE_SHAPES[p.id].d}
            role="button"
            tabIndex={inScope(p.id) ? 0 : -1}
            aria-label={`${p.name}: ${SHORT_LABEL[mapk]} ${fmtTile(mapk, p[mapk])}${below(mapk, p) ? ", below alert threshold" : ""}`}
            aria-pressed={selected === p.id}
            fill={fill(p)}
            stroke="var(--card)"
            strokeWidth={1.25}
            strokeLinejoin="round"
            className={cn("cursor-pointer outline-none", !inScope(p.id) && "cursor-default opacity-25")}
            onFocus={() => point(p.id)}
            onBlur={() => point(null)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && inScope(p.id)) {
                e.preventDefault()
                onSelect(p.id)
              }
            }}
          />
        ))}
        {PROVINCES.filter((p) => !raised.has(p.id)).map((p) => (
          <ProvinceLabel key={p.id} p={p} mapk={mapk} dim={!inScope(p.id)} />
        ))}

        {/* Raised provinces are drawn again on top, lifted, with a shadow left on the board. */}
        {[...(landing && !lifted.includes(landing) ? [landing] : []), ...lifted].map((id) => {
          const p = provById(id)
          const up = lifted.includes(id)
          return (
            <g key={id} data-prov={id} className="cursor-pointer" aria-hidden>
              {up && (
                <path
                  d={PROVINCE_SHAPES[id].d}
                  transform={`translate(0 ${DEPTH + 2})`}
                  fill="black"
                  opacity={0.35}
                  filter="url(#map-shadow)"
                  className="map-shadow"
                />
              )}
              <g className={up ? "map-lift" : "map-drop"}>
                {walls(p)}
                <path
                  d={PROVINCE_SHAPES[id].d}
                  fill={fill(p)}
                  stroke={id === selected ? "var(--accent)" : "var(--card)"}
                  strokeWidth={id === selected ? 3.5 : 1.25}
                  strokeLinejoin="round"
                />
                <ProvinceLabel p={p} mapk={mapk} />
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ProvinceLabel({ p, mapk, dim }: { p: Province; mapk: MapKey; dim?: boolean }) {
  const [dx, dy] = LABEL_NUDGE[p.id] ?? [0, 0]
  const cx = PROVINCE_SHAPES[p.id].cx + dx
  const cy = PROVINCE_SHAPES[p.id].cy + dy
  const color = scaleIndex(mapk, p[mapk]) >= 3 ? "var(--primary-foreground)" : "var(--foreground)"
  return (
    <g pointerEvents="none" className={cn(dim && "opacity-40")} aria-hidden>
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fill={color}>
        {p.short}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={15} fontWeight={700} fill={color}>
        {fmtTile(mapk, p[mapk])}
      </text>
      {below(mapk, p) && <circle cx={cx + 30} cy={cy - 8} r={5.5} fill="var(--warning)" stroke="var(--card)" strokeWidth={1.5} />}
    </g>
  )
}
