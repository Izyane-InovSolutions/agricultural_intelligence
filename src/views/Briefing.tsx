import { useState } from "react"
import { Check, FileDown, Pencil, Printer, RotateCcw, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { AUDIENCES, BUDGET_RELEASED, PROVINCES, ROLES, type AudienceId, type Source } from "@/data/demo"
import { fmtDate, fmtN } from "@/lib/format"
import { aggregate, provById } from "@/lib/scope"
import { briefKey, useStore, type BriefEvent } from "@/lib/store"
import { cn } from "@/lib/utils"

const STEPS = ["Draft generated from AgID", "Checked by Planning and M&E", "Approved by the Permanent Secretary"]
const EVENT_LABEL: Record<BriefEvent["kind"], string> = {
  checked: "Checked",
  approved: "Approved",
  returned: "Sent back for revision",
  edited: "Key messages edited",
  restarted: "Sign-off restarted",
}
const FOOTNOTE =
  "Sources: 1 ZIAMIS (MoA). 2 Zambia Meteorological Department. 3 Food Reserve Agency. 4 Zambia Statistics Agency. Each figure is traceable in the AgID audit log. Demonstration data only."

type BriefDoc = {
  title: string
  meta: string
  generated: string[]
  rows: [indicator: string, value: string, source: string, note: number][]
  decisionTitle: string
  decision: string
}

function buildBrief(aud: AudienceId, scope: string, sources: Source[]): BriefDoc {
  const list = scope === "national" ? PROVINCES : [provById(scope)]
  const a = aggregate(list)
  const where = scope === "national" ? "Zambia" : provById(scope).name + " Province"
  const dry = list.filter((p) => p.rain < 80).sort((x, y) => x.rain - y.rain)
  const slow = list.filter((p) => p.delivery < 70).sort((x, y) => x.delivery - y.delivery)
  const src = (id: string) => sources.find((s) => s.id === id)!
  const zs = src("zamstats")

  const generated = [
    `${fmtN(a.farmers)} farmers are registered for the 2026/27 season, ${a.women}% of them women.`,
    `Inputs have reached ${a.delivery}% of planned farmers${slow.length ? `, but delivery is behind in ${slow.map((p) => `${p.name} (${p.delivery}%)`).join(" and ")}.` : "."}`,
    dry.length
      ? `Early-season rainfall is below 80% of normal in ${dry.map((p) => `${p.name} (${p.rain}%)`).join(" and ")}. Crop and food security risk should be monitored.`
      : "Early-season rainfall is close to normal across the area covered.",
  ]
  if (aud === "parl") generated.push(`${BUDGET_RELEASED}% of the agriculture programme budget has been released so far this year.`)
  if (aud === "cp")
    generated.push(`${sources.filter((s) => s.dsa !== "no").length} of ${sources.length} inter-agency data-sharing agreements are signed or in final drafting.`)

  const watch = [...new Set(dry.concat(slow).map((p) => p.name))]
  return {
    title: `Agricultural situation brief: ${where}`,
    meta: `For: ${AUDIENCES[aud]}. From: Permanent Secretary, Ministry of Agriculture. Prepared from AgID on ${fmtDate(new Date())}.`,
    generated,
    rows: [
      ["Registered farmers", fmtN(a.farmers), `ZIAMIS, ${src("ziamis").upd}`, 1],
      ["Input delivery rate", a.delivery + "%", `ZIAMIS e-voucher, ${src("ziamis").upd}`, 1],
      ["Rainfall against normal", a.rain + "%", `ZMD bulletin, ${src("zmd").upd}`, 2],
      ["FRA maize purchased", fmtN(a.fra) + " t", `FRA depot records, ${src("fra").upd}`, 3],
      ["Maize price, 50 kg", "ZMW " + a.price, `ZamStats, ${zs.upd}${zs.stale ? " (out of date)" : ""}`, 4],
    ],
    decisionTitle: aud === "cab" ? "Decision requested" : "Areas needing attention",
    decision:
      aud === "cab"
        ? slow.length
          ? `Cabinet is asked to note the situation and approve accelerated input distribution in ${slow.map((p) => p.name).join(" and ")}.`
          : "Cabinet is asked to note the situation."
        : watch.length
          ? `Provinces to watch: ${watch.join(", ")}.`
          : "No province is below alert thresholds.",
  }
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Word opens HTML saved as .doc, which keeps headings and the table without a document library.
function downloadWord(doc: BriefDoc, messages: string[], stamp: string) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(doc.title)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1f2a1f}h1{color:#1b6b33;font-size:16pt;margin:0}
h2{color:#1b6b33;font-size:12pt;margin:16pt 0 4pt}.meta{color:#555;border-bottom:2px solid #ef7d00;padding-bottom:6pt}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:4pt 6pt;text-align:left}th{background:#eef6ef}
.foot{font-size:9pt;color:#666}.stamp{font-weight:bold;color:#c2410c}</style></head><body>
<h1>${esc(doc.title)}</h1><p class="meta">${esc(doc.meta)}</p>
<h2>Key messages</h2><ul>${messages.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
<h2>Indicators</h2><table><tr><th>Indicator</th><th>Value</th><th>Source</th></tr>
${doc.rows.map(([i, v, s, n]) => `<tr><td>${esc(i)}</td><td>${esc(v)}</td><td>${esc(s)} <sup>${n}</sup></td></tr>`).join("")}</table>
<h2>${esc(doc.decisionTitle)}</h2><p>${esc(doc.decision)}</p>
<p class="foot">${esc(FOOTNOTE)}</p><p class="stamp">${esc(stamp)}</p></body></html>`
  const url = URL.createObjectURL(new Blob(["﻿", html], { type: "application/msword" }))
  const a = document.createElement("a")
  a.href = url
  a.download = doc.title.replace(/[^\w]+/g, "-").replace(/-$/, "") + ".doc"
  a.click()
  URL.revokeObjectURL(url)
}

export function Briefing() {
  const { role, prov, sources, getBrief, advanceBrief, returnBrief, editBrief, resetBrief } = useStore()
  const r = ROLES[role]
  const national = r.scope === "national"
  const [aud, setAud] = useState<AudienceId>("cab")
  const [pickedScope, setScope] = useState("national")
  const scope = national ? pickedScope : prov
  const [editing, setEditing] = useState<string | null>(null)
  const [returning, setReturning] = useState(false)
  const [comment, setComment] = useState("")

  const key = briefKey(aud, scope)
  const brief = getBrief(key)
  const step = brief.step
  const doc = buildBrief(aud, scope, sources)
  const messages = brief.messages ?? doc.generated
  const lastReturn = [...brief.history].reverse().find((h) => h.kind === "returned")
  const returnedOpen = step === 0 && lastReturn && brief.history[brief.history.length - 1] === lastReturn
  const stamp = step === 2 ? "APPROVED" : step === 1 ? "CHECKED – awaiting approval" : returnedOpen ? "DRAFT – returned for revision" : "DRAFT – not for circulation"

  // Who signed each step most recently (a returned brief clears later steps).
  const signedAt = (s: number) => {
    if (s === 0 || s > step) return undefined
    return [...brief.history].reverse().find((h) => h.kind === (s === 1 ? "checked" : "approved"))
  }

  let advanceLabel = "Approved"
  let canAdvance = false
  if (step === 0) {
    advanceLabel = "Mark as checked"
    canAdvance = r.brief === "check"
  } else if (step === 1) {
    advanceLabel = "Approve brief"
    canAdvance = r.brief === "approve"
  }
  const canEdit = step === 0 && r.brief === "check"
  const canReturn = step === 1 && r.brief === "approve"

  let roleMsg = ""
  if (r.brief === "view") roleMsg = "Your role can read briefs for your area. Checking and approval sit with HQ and the Permanent Secretary."
  else if (step === 0 && r.brief === "approve") roleMsg = "Switch to the Planning and M&E role to check this draft first."
  else if (step === 1 && r.brief === "check") roleMsg = "Switch to the Permanent Secretary role to approve or send it back."

  const changeBrief = (fn: () => void) => {
    setEditing(null)
    fn()
  }

  const saveEdit = () => {
    const lines = (editing ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
    editBrief(key, lines.length ? lines : undefined)
    setEditing(null)
    toast.success("Key messages saved")
  }

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

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6 print:hidden">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Brief settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="aud">Audience</Label>
                <Select value={aud} onValueChange={(v) => changeBrief(() => setAud(v as AudienceId))}>
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
                <Select value={scope} onValueChange={(v) => changeBrief(() => setScope(v))} disabled={!national}>
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
                    const ev = signedAt(i)
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

              {returnedOpen && lastReturn && (
                <Alert className="border-warning/40 bg-warning/10">
                  <Undo2 className="text-warning" />
                  <AlertTitle className="text-warning">Sent back by {ROLES[lastReturn.by].name}</AlertTitle>
                  <AlertDescription>“{lastReturn.comment}”</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => changeBrief(() => advanceBrief(key))} disabled={!canAdvance || editing !== null}>
                  {advanceLabel}
                </Button>
                {canReturn && (
                  <Button variant="outline" onClick={() => setReturning(true)}>
                    <Undo2 /> Send back
                  </Button>
                )}
                {canEdit && editing === null && (
                  <Button variant="outline" onClick={() => setEditing(messages.join("\n"))}>
                    <Pencil /> Edit messages
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  <Printer /> Print or save PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadWord(doc, messages, stamp)}>
                  <FileDown /> Word
                </Button>
                {step > 0 && r.brief !== "view" && (
                  <Button variant="ghost" size="sm" onClick={() => changeBrief(() => resetBrief(key))}>
                    <RotateCcw /> Restart
                  </Button>
                )}
              </div>
              {roleMsg && <p className="text-sm text-muted-foreground">{roleMsg}</p>}
            </CardContent>
          </Card>

          {brief.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {[...brief.history].reverse().map((h, i) => (
                    <li key={i} className="border-l-2 border-accent pl-3 text-sm">
                      <div className="font-medium">{EVENT_LABEL[h.kind]}</div>
                      <div className="text-xs text-muted-foreground">
                        {ROLES[h.by].name}, {h.at}
                      </div>
                      {h.comment && <div className="mt-0.5">“{h.comment}”</div>}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        {/* The brief is printed as a document, so it uses fixed light colours. */}
        <article className="h-fit rounded-md border bg-white p-6 text-[15px] text-neutral-800 shadow-sm sm:p-10 print:border-0 print:p-0 print:shadow-none">
          <div className="mb-4 border-b-2 border-[#ef7d00] pb-3">
            <h2 className="text-xl font-semibold text-[#1b6b33]">{doc.title}</h2>
            <p className="mt-1 text-sm text-neutral-500">{doc.meta}</p>
          </div>

          <h3 className="mt-5 mb-2 font-semibold text-[#1b6b33]">Key messages</h3>
          {editing !== null ? (
            <div className="space-y-2 print:hidden">
              <Label htmlFor="msgs" className="text-neutral-600">
                One message per line. Figures in the table below stay linked to the data store.
              </Label>
              <Textarea id="msgs" value={editing} onChange={(e) => setEditing(e.target.value)} rows={7} className="bg-white text-neutral-800" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={saveEdit}>
                  Save messages
                </Button>
                <Button size="sm" variant="outline" className="bg-white text-neutral-800" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                {brief.messages && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-neutral-600"
                    onClick={() => {
                      editBrief(key, undefined)
                      setEditing(null)
                    }}
                  >
                    Reset to generated text
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              {messages.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
          {brief.messages && editing === null && <p className="mt-1 text-xs text-neutral-500 print:hidden">Edited from the generated text.</p>}

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
              {doc.rows.map(([i, v, s, n]) => (
                <TableRow key={i} className="border-neutral-200 hover:bg-transparent">
                  <TableCell>{i}</TableCell>
                  <TableCell className="text-right tabular-nums">{v}</TableCell>
                  <TableCell className="whitespace-normal">
                    {s} <sup className="text-[#c2410c]">{n}</sup>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <h3 className="mt-5 mb-2 font-semibold text-[#1b6b33]">{doc.decisionTitle}</h3>
          <p>{doc.decision}</p>

          <p className="mt-5 text-xs text-neutral-500">{FOOTNOTE}</p>
          <div
            className={cn(
              "mt-4 inline-block -rotate-2 border-2 px-3 py-1 font-bold",
              step === 2 ? "border-[#1b6b33] text-[#1b6b33]" : "border-[#c2410c] text-[#c2410c]",
            )}
          >
            {stamp}
          </div>
        </article>
      </div>

      <Dialog
        open={returning}
        onOpenChange={(o) => {
          setReturning(o)
          if (!o) setComment("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send this brief back?</DialogTitle>
            <DialogDescription>Planning and M&amp;E will see your comment and must check the brief again before it can be approved.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="ret">What needs to change?</Label>
            <Textarea id="ret" value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="For example: add the Western Province flood outlook." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturning(false)}>
              Cancel
            </Button>
            <Button
              disabled={!comment.trim()}
              onClick={() => {
                returnBrief(key, comment.trim())
                setReturning(false)
                setComment("")
                toast("Brief sent back to Planning and M&E")
              }}
            >
              <Undo2 /> Send back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
