import { useState } from "react"
import { Check, Printer, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AUDIENCES, BUDGET_RELEASED, PROVINCES, ROLES, type AudienceId } from "@/data/demo"
import { fmtN } from "@/lib/format"
import { aggregate, provById } from "@/lib/scope"
import { briefKey, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const STEPS = ["Draft generated from AgID", "Checked by Planning and M&E", "Approved by the Permanent Secretary"]
const STAMPS = ["DRAFT – not for circulation", "CHECKED – awaiting approval", "APPROVED"]

export function Briefing() {
  const { role, prov, sources, getBrief, advanceBrief, resetBrief } = useStore()
  const r = ROLES[role]
  const national = r.scope === "national"
  const [aud, setAud] = useState<AudienceId>("cab")
  const [pickedScope, setScope] = useState("national")
  const scope = national ? pickedScope : prov

  const key = briefKey(aud, scope)
  const brief = getBrief(key)
  const step = brief.step

  const list = scope === "national" ? PROVINCES : [provById(scope)]
  const a = aggregate(list)
  const where = scope === "national" ? "Zambia" : provById(scope).name + " Province"
  const dry = list.filter((p) => p.rain < 80).sort((x, y) => x.rain - y.rain)
  const slow = list.filter((p) => p.delivery < 70).sort((x, y) => x.delivery - y.delivery)
  const src = (id: string) => sources.find((s) => s.id === id)!
  const signedOrDrafting = sources.filter((s) => s.dsa !== "no").length

  const rows: [string, string, string, number][] = [
    ["Registered farmers", fmtN(a.farmers), `ZIAMIS, ${src("ziamis").upd}`, 1],
    ["Input delivery rate", a.delivery + "%", `ZIAMIS e-voucher, ${src("ziamis").upd}`, 1],
    ["Rainfall against normal", a.rain + "%", `ZMD bulletin, ${src("zmd").upd}`, 2],
    ["FRA maize purchased", fmtN(a.fra) + " t", `FRA depot records, ${src("fra").upd}`, 3],
    ["Maize price, 50 kg", "ZMW " + a.price, `ZamStats, ${src("zamstats").upd}${src("zamstats").stale ? " (out of date)" : ""}`, 4],
  ]

  let advanceLabel = "Approved"
  let canAdvance = false
  if (step === 0) {
    advanceLabel = "Mark as checked"
    canAdvance = r.brief === "check"
  } else if (step === 1) {
    advanceLabel = "Approve brief"
    canAdvance = r.brief === "approve"
  }

  let roleMsg = ""
  if (r.brief === "view") roleMsg = "Your role can read briefs for your area. Checking and approval sit with HQ and the Permanent Secretary."
  else if (step === 0 && r.brief === "approve") roleMsg = "Switch to the Planning and M&E role to check this draft first."
  else if (step === 1 && r.brief === "check") roleMsg = "Switch to the Permanent Secretary role to approve."

  return (
    <section aria-labelledby="h-br" className="space-y-6">
      <div className="print:hidden">
        <h1 id="h-br" className="text-3xl font-semibold tracking-tight text-primary">
          Briefings
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Build a brief in minutes instead of weeks. Figures come straight from the data store with their sources footnoted, and
          nothing leaves the Ministry until it has been checked and approved.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="h-fit print:hidden">
          <CardHeader>
            <CardTitle className="text-lg">Brief settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="aud">Audience</Label>
              <Select value={aud} onValueChange={(v) => setAud(v as AudienceId)}>
                <SelectTrigger id="aud" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(AUDIENCES) as AudienceId[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {k === "cp" ? "Cooperating partners" : AUDIENCES[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bscope">Scope</Label>
              <Select value={scope} onValueChange={setScope} disabled={!national}>
                <SelectTrigger id="bscope" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {national && <SelectItem value="national">National</SelectItem>}
                  {(national ? PROVINCES : [provById(prov)]).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} Province
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="mb-2 font-semibold">Sign-off</h3>
              <ol className="space-y-2">
                {STEPS.map((s, i) => {
                  const ev = brief.history.find((h) => h.step === i)
                  const done = i <= step
                  return (
                    <li key={s} className="flex gap-2.5">
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                          done ? "border-primary bg-primary text-primary-foreground" : "border-border",
                        )}
                      >
                        {done && <Check className="size-3" />}
                      </span>
                      <div className={cn(!done && "text-muted-foreground")}>
                        {s}
                        {ev && (
                          <div className="text-xs text-muted-foreground">
                            {ROLES[ev.by].name}, {ev.at}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => advanceBrief(key)} disabled={!canAdvance}>
                {advanceLabel}
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Printer /> Print
              </Button>
              {step > 0 && r.brief !== "view" && (
                <Button variant="ghost" onClick={() => resetBrief(key)}>
                  <RotateCcw /> Restart
                </Button>
              )}
            </div>
            {roleMsg && <p className="text-sm text-muted-foreground">{roleMsg}</p>}
          </CardContent>
        </Card>

        {/* The brief is printed as a document, so it uses fixed light colours. */}
        <article className="rounded-md border bg-white p-6 text-[15px] text-neutral-800 shadow-sm sm:p-10 print:border-0 print:p-0 print:shadow-none">
          <div className="mb-4 flex items-start justify-between gap-4 border-b-2 border-[#ef7d00] pb-3">
            <div>
              <h2 className="text-xl font-semibold text-[#1b6b33]">Agricultural situation brief: {where}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                For: {AUDIENCES[aud]}. From: Permanent Secretary, Ministry of Agriculture. Prepared from AgID on 2 November 2026.
              </p>
            </div>
          </div>

          <h3 className="mt-5 mb-2 font-semibold text-[#1b6b33]">Key messages</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              {fmtN(a.farmers)} farmers are registered for the 2026/27 season, {a.women}% of them women.
            </li>
            <li>
              Inputs have reached {a.delivery}% of planned farmers
              {slow.length ? `, but delivery is behind in ${slow.map((p) => `${p.name} (${p.delivery}%)`).join(" and ")}.` : "."}
            </li>
            <li>
              {dry.length
                ? `Early-season rainfall is below 80% of normal in ${dry.map((p) => `${p.name} (${p.rain}%)`).join(" and ")}. Crop and food security risk should be monitored.`
                : "Early-season rainfall is close to normal across the area covered."}
            </li>
            {aud === "parl" && <li>{BUDGET_RELEASED}% of the agriculture programme budget has been released so far this year.</li>}
            {aud === "cp" && (
              <li>
                {signedOrDrafting} of {sources.length} inter-agency data-sharing agreements are signed or in final drafting.
              </li>
            )}
          </ul>

          <h3 className="mt-5 mb-2 font-semibold text-[#1b6b33]">Indicators</h3>
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="bg-[#eef6ef] hover:bg-[#eef6ef]">
                <TableHead className="text-[#1b6b33]">Indicator</TableHead>
                <TableHead className="text-right text-[#1b6b33]">Value</TableHead>
                <TableHead className="text-[#1b6b33]">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([i, v, s, n]) => (
                <TableRow key={i} className="border-neutral-200 hover:bg-transparent">
                  <TableCell>{i}</TableCell>
                  <TableCell className="text-right tabular-nums">{v}</TableCell>
                  <TableCell className="whitespace-normal">
                    {s} <sup className="text-[#ef7d00]">{n}</sup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <h3 className="mt-5 mb-2 font-semibold text-[#1b6b33]">{aud === "cab" ? "Decision requested" : "Areas needing attention"}</h3>
          <p>
            {aud === "cab"
              ? slow.length
                ? `Cabinet is asked to note the situation and approve accelerated input distribution in ${slow.map((p) => p.name).join(" and ")}.`
                : "Cabinet is asked to note the situation."
              : dry.concat(slow).length
                ? `Provinces to watch: ${[...new Set(dry.concat(slow).map((p) => p.name))].join(", ")}.`
                : "No province is below alert thresholds."}
          </p>

          <p className="mt-5 text-xs text-neutral-500">
            Sources: 1 ZIAMIS (MoA). 2 Zambia Meteorological Department. 3 Food Reserve Agency. 4 Zambia Statistics Agency. Each figure
            is traceable in the AgID audit log. Demonstration data only.
          </p>
          <div
            className={cn(
              "mt-4 inline-block -rotate-2 border-2 px-3 py-1 font-bold",
              step === 2 ? "border-[#1b6b33] text-[#1b6b33]" : "border-[#c2410c] text-[#c2410c]",
            )}
          >
            {STAMPS[step]}
          </div>
        </article>
      </div>
    </section>
  )
}
