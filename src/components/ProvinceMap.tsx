import { useEffect, useRef, useState } from "react"
import { Map as MapIcon, Table2 } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PROVINCES, ROLES, type Area, type MapKey } from "@/data/demo"
import { DISTRICT_MAPS } from "@/data/district-map"
import { MAP_VIEWBOX, PROVINCE_SHAPES } from "@/data/zambia-map"
import { fmtK } from "@/lib/format"
import { kpiById } from "@/lib/kpis"
import { aggregate, districtIn, districtsOf, provById } from "@/lib/scope"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const MAP_KEYS: MapKey[] = ["farmers", "delivery", "rain", "fra"]
const SHORT_LABEL: Record<MapKey, string> = { farmers: "Registered farmers", delivery: "Input delivery", rain: "Rainfall", fra: "FRA purchases" }
// Moves labels off borders where a province's centre point sits awkwardly.
const PROVINCE_NUDGE: Record<string, [number, number]> = { eastern: [-8, 22], luapula: [-4, 6] }
const SCALE = ["--scale-1", "--scale-2", "--scale-3", "--scale-4", "--scale-5"]
// Thresholds below which an area raises an alert.
const THRESHOLD: Partial<Record<MapKey, number>> = { delivery: 70, rain: 80 }

const fmtTile = (k: MapKey, v: number) => (k === "farmers" ? fmtK(v) : k === "fra" ? fmtK(v) + " t" : v + "%")
const below = (k: MapKey, a: Area) => THRESHOLD[k] !== undefined && a[k] < THRESHOLD[k]!
const ordinal = (n: number) => n + (n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th")

// Position of an area among its peers for an indicator, 1 = best.
export type Figure = "farmers" | "women" | "delivery" | "rain" | "fra" | "price"
export function rankIn(list: Area[], k: Figure, id: string, higherIsBetter = true) {
  const sorted = [...list].sort((a, b) => (higherIsBetter ? b[k] - a[k] : a[k] - b[k]))
  return sorted.findIndex((a) => a.id === id) + 1
}

export function ProvinceMap({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const { role, prov, dist, mapk, setMapk, mapView, setMapView, sources } = useStore()
  const scope = ROLES[role].scope
  const district = scope === "district"
  const kpi = kpiById(mapk)
  const nat = kpi.value(aggregate(PROVINCES))
  const p = provById(prov)
  const own = district ? districtIn(prov, dist).id : null
  const areas: Area[] = district ? districtsOf(prov) : PROVINCES
  const inScope = (id: string) => scope !== "province" || id === prov

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{district ? `Districts in ${p.name} Province` : "Provinces"}</CardTitle>
        <CardDescription>
          {district
            ? mapView === "map"
              ? "Your district is outlined. Select any district to compare it with yours."
              : "Every district in the province, ranked. Your district is highlighted."
            : mapView === "map"
              ? "Select a province to see its figures."
              : "The same figures as a table, compared with the national picture."}
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
            {district ? (
              <Map3D
                key={prov}
                areas={areas}
                shapes={DISTRICT_MAPS[prov].shapes}
                viewBox={DISTRICT_MAPS[prov].viewBox}
                label={`Map of the districts of ${p.name} Province`}
                selected={selected}
                onSelect={onSelect}
                inScope={inScope}
                mark={own}
                mapk={mapk}
              />
            ) : (
              <Map3D
                areas={areas}
                shapes={PROVINCE_SHAPES}
                viewBox={MAP_VIEWBOX}
                label="Map of Zambia's ten provinces"
                nudge={PROVINCE_NUDGE}
                selected={selected}
                onSelect={onSelect}
                inScope={inScope}
                mapk={mapk}
              />
            )}
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
                <TableHead>{district ? "District" : "Province"}</TableHead>
                <TableHead className="text-right">{SHORT_LABEL[mapk]}</TableHead>
                <TableHead className="text-right">{district ? "Rank in province" : kpi.count ? "Share of national" : "National average"}</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...areas]
                .filter((a) => inScope(a.id))
                .sort((a, b) => b[mapk] - a[mapk])
                .map((a, i) => (
                  <TableRow
                    key={a.id}
                    onClick={() => onSelect(a.id)}
                    className={cn("cursor-pointer", selected === a.id && "bg-accent/10", a.id === own && "font-semibold")}
                  >
                    <TableCell className="font-medium">
                      {a.name}
                      {a.id === own && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(your district)</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{kpi.full(a[mapk])}</TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {district
                        ? `${ordinal(i + 1)} of ${areas.length}`
                        : kpi.count
                          ? Math.round((a[mapk] / nat) * 100) + "%"
                          : kpi.full(nat)}
                    </TableCell>
                    <TableCell>
                      {below(mapk, a) ? (
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
          Source: {sources.find((s) => s.id === kpi.sourceId)!.agency}.{" "}
          {district
            ? "District boundaries: geoBoundaries / GRID3 and Office of the Surveyor General (CC BY 4.0)."
            : "Boundaries: geoBoundaries / Zambia Data Hub (CC BY 4.0)."}
        </p>
      </CardContent>
    </Card>
  )
}

type Shape = { d: string; cx: number; cy: number; r?: number }

// Height of each area's side wall, in map units.
const DEPTH = 7

type MapProps = {
  areas: Area[]
  shapes: Record<string, Shape>
  viewBox: string
  label: string
  nudge?: Record<string, [number, number]>
  selected: string | null
  onSelect: (id: string) => void
  inScope: (id: string) => boolean
  // An area to outline permanently, such as the user's own district.
  mark?: string | null
  mapk: MapKey
}

function Map3D({ areas, shapes, viewBox, label, nudge, selected, onSelect, inScope, mark, mapk }: MapProps) {
  const [hover, setHover] = useState<string | null>(null)
  const [landing, setLanding] = useState<string | null>(null)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const [vx, vy, vw, vh] = viewBox.split(" ").map(Number)
  // Extra room above for lifted areas and below for the walls.
  const viewBox3D = `${vx} ${vy - 14} ${vw} ${vh + 14 + DEPTH + 4}`
  const byId = (id: string) => areas.find((a) => a.id === id)!

  const vals = areas.map((a) => a[mapk])
  const mn = Math.min(...vals)
  const mx = Math.max(...vals)
  const scaleIndex = (v: number) => Math.min(4, Math.floor(((v - mn) / (mx - mn || 1)) * 5))

  const point = (id: string | null) => {
    if (id === hover) return
    // Let the previous area settle back down before it disappears from the top layer.
    if (hover && hover !== selected) {
      setLanding(hover)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setLanding(null), 170)
    }
    setHover(id && inScope(id) ? id : null)
  }
  // Hit-testing goes through data-area so the lifted copy and the base shape count as one area.
  const areaAt = (t: EventTarget) => (t as Element).closest?.("[data-area]")?.getAttribute("data-area") ?? null

  const lifted = [...new Set([selected, hover].filter((x): x is string => !!x))]
  const raised = new Set([...lifted, landing])
  const fill = (a: Area) => `var(${SCALE[scaleIndex(a[mapk])]})`
  const wall = (a: Area) => `color-mix(in oklch, ${fill(a)}, black 30%)`
  const walls = (a: Area) =>
    Array.from({ length: DEPTH }, (_, i) => (
      <path key={i} d={shapes[a.id].d} transform={`translate(0 ${DEPTH - i})`} style={{ fill: wall(a) }} />
    ))
  const stroke = (id: string) =>
    id === selected ? { stroke: "var(--accent)", strokeWidth: 3.5 } : id === mark ? { stroke: "var(--foreground)", strokeWidth: 2.5 } : { stroke: "var(--card)", strokeWidth: 1.25 }
  const labelProps = (a: Area, full?: boolean) => ({
    a,
    shape: shapes[a.id],
    nudge: nudge?.[a.id],
    mapk,
    dark: scaleIndex(a[mapk]) >= 3,
    full: full || a.id === mark,
  })

  return (
    <div className="mx-auto w-full max-w-xl [perspective:1600px]">
      <svg
        viewBox={viewBox3D}
        className="w-full origin-bottom [transform:rotateX(22deg)]"
        role="group"
        aria-label={label}
        onPointerMove={(e) => point(areaAt(e.target))}
        onPointerLeave={() => point(null)}
        onClick={(e) => {
          // The lifted copy can appear between press and release, which sends the click to the svg itself.
          const id = areaAt(e.target) ?? hover
          if (id && inScope(id)) onSelect(id)
        }}
      >
        <defs>
          <filter id="map-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Walls first, then every top face, so no wall covers a neighbour's top. */}
        {areas.map((a) => (
          <g key={a.id} data-area={a.id} className={cn(!inScope(a.id) && "opacity-25")}>
            {walls(a)}
          </g>
        ))}
        {areas.map((a) => (
          <path
            key={a.id}
            data-area={a.id}
            d={shapes[a.id].d}
            role="button"
            tabIndex={inScope(a.id) ? 0 : -1}
            aria-label={`${a.name}${a.id === mark ? " (your district)" : ""}: ${SHORT_LABEL[mapk]} ${fmtTile(mapk, a[mapk])}${below(mapk, a) ? ", below alert threshold" : ""}`}
            aria-pressed={selected === a.id}
            fill={fill(a)}
            stroke="var(--card)"
            strokeWidth={1.25}
            strokeLinejoin="round"
            className={cn("cursor-pointer outline-none", !inScope(a.id) && "cursor-default opacity-25")}
            onFocus={() => point(a.id)}
            onBlur={() => point(null)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && inScope(a.id)) {
                e.preventDefault()
                onSelect(a.id)
              }
            }}
          />
        ))}
        {/* The user's own area keeps a strong outline even when it is not raised. */}
        {mark && !raised.has(mark) && (
          <path d={shapes[mark].d} fill="none" strokeLinejoin="round" pointerEvents="none" {...stroke(mark)} />
        )}
        {areas
          .filter((a) => !raised.has(a.id))
          .map((a) => (
            <AreaLabel key={a.id} {...labelProps(a)} dim={!inScope(a.id)} />
          ))}

        {/* Raised areas are drawn again on top, lifted, with a shadow left on the board. */}
        {[...(landing && !lifted.includes(landing) ? [landing] : []), ...lifted].map((id) => {
          const a = byId(id)
          const up = lifted.includes(id)
          return (
            <g key={id} data-area={id} className="cursor-pointer" aria-hidden>
              {up && (
                <path
                  d={shapes[id].d}
                  transform={`translate(0 ${DEPTH + 2})`}
                  fill="black"
                  opacity={0.35}
                  filter="url(#map-shadow)"
                  className="map-shadow"
                />
              )}
              <g className={up ? "map-lift" : "map-drop"}>
                {walls(a)}
                <path d={shapes[id].d} fill={fill(a)} strokeLinejoin="round" {...stroke(id)} />
                <AreaLabel {...labelProps(a, true)} />
              </g>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

type LabelProps = { a: Area; shape: Shape; nudge?: [number, number]; mapk: MapKey; dark: boolean; full?: boolean; dim?: boolean }

function AreaLabel({ a, shape, nudge = [0, 0], mapk, dark, full, dim }: LabelProps) {
  // Small districts only show their figure until they are raised, so labels do not pile up.
  const room = shape.r ?? Infinity
  const size = full || room >= 24 ? "lg" : room >= 13 ? "sm" : null
  if (!size) return null
  const cx = shape.cx + nudge[0]
  const cy = shape.cy + nudge[1]
  const color = dark ? "var(--primary-foreground)" : "var(--foreground)"
  const lg = size === "lg"
  return (
    <g pointerEvents="none" className={cn(dim && "opacity-40")} aria-hidden>
      {lg && (
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={11} fill={color}>
          {a.short ?? a.name}
        </text>
      )}
      <text x={cx} y={lg ? cy + 12 : cy + 4} textAnchor="middle" fontSize={lg ? 15 : 11} fontWeight={700} fill={color}>
        {fmtTile(mapk, a[mapk])}
      </text>
      {below(mapk, a) && (
        <circle cx={cx + (lg ? 30 : 20)} cy={lg ? cy - 8 : cy - 4} r={lg ? 5.5 : 4} fill="var(--warning)" stroke="var(--card)" strokeWidth={1.5} />
      )}
    </g>
  )
}
