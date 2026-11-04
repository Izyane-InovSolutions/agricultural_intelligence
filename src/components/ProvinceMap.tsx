import { Map as MapIcon, Table2 } from "lucide-react"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PROVINCES, ROLES, type MapKey, type Province } from "@/data/demo"
import { MAP_VIEWBOX, PROVINCE_SHAPES } from "@/data/zambia-map"
import { fmtK } from "@/lib/format"
import { kpiById } from "@/lib/kpis"
import { aggregate } from "@/lib/scope"
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
            <svg viewBox={MAP_VIEWBOX} className="mx-auto w-full max-w-xl" role="group" aria-label="Map of Zambia's ten provinces">
              {PROVINCES.map((p) => {
                const shape = PROVINCE_SHAPES[p.id]
                const inScope = national || p.id === prov
                const pick = () => inScope && onSelect(p.id)
                return (
                  <path
                    key={p.id}
                    d={shape.d}
                    role="button"
                    tabIndex={inScope ? 0 : -1}
                    aria-label={`${p.name}: ${SHORT_LABEL[mapk]} ${fmtTile(mapk, p[mapk])}${below(mapk, p) ? ", below alert threshold" : ""}`}
                    aria-pressed={selected === p.id}
                    fill={`var(${SCALE[scaleIndex(mapk, p[mapk])]})`}
                    stroke="var(--card)"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    className={cn(
                      "cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:opacity-80",
                      !inScope && "cursor-default opacity-25",
                    )}
                    onClick={pick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        pick()
                      }
                    }}
                  />
                )
              })}
              {/* Selection outline is drawn on top so neighbouring provinces never cover it. */}
              {selected && (
                <path d={PROVINCE_SHAPES[selected].d} fill="none" stroke="var(--accent)" strokeWidth={4} strokeLinejoin="round" pointerEvents="none" />
              )}
              {PROVINCES.map((p) => {
                const [dx, dy] = LABEL_NUDGE[p.id] ?? [0, 0]
                const cx = PROVINCE_SHAPES[p.id].cx + dx
                const cy = PROVINCE_SHAPES[p.id].cy + dy
                const inScope = national || p.id === prov
                const dark = scaleIndex(mapk, p[mapk]) >= 3
                return (
                  <g key={p.id} pointerEvents="none" className={cn(!inScope && "opacity-40")} aria-hidden>
                    <text
                      x={cx}
                      y={cy - 4}
                      textAnchor="middle"
                      fontSize={11}
                      fill={dark ? "var(--primary-foreground)" : "var(--foreground)"}
                    >
                      {p.short}
                    </text>
                    <text
                      x={cx}
                      y={cy + 12}
                      textAnchor="middle"
                      fontSize={15}
                      fontWeight={700}
                      fill={dark ? "var(--primary-foreground)" : "var(--foreground)"}
                    >
                      {fmtTile(mapk, p[mapk])}
                    </text>
                    {below(mapk, p) && <circle cx={cx + 30} cy={cy - 8} r={5.5} fill="var(--warning)" stroke="var(--card)" strokeWidth={1.5} />}
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
