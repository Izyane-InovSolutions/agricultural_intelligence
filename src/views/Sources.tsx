import { useEffect, useRef, useState } from "react"
import { CircleCheck, CircleDashed, CircleMinus, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DSA_LABEL, ROLES, type DsaStatus, type Source } from "@/data/demo"
import { heldRecords } from "@/data/held"
import { fmtN } from "@/lib/format"
import { useStore, type SyncPlan } from "@/lib/store"
import { cn } from "@/lib/utils"

const PIPELINE: [string, string][] = [
  ["Agency systems", "ZIAMIS, FRA, ZMD, ZamStats, MoF, MCDSS, MGEE"],
  ["Government Service Bus", "Secure exchange on Smart Zambia infrastructure"],
  ["Check and harmonise", "Reference codes, quality rules, exceptions to stewards"],
  ["AgID data store", "Version history, timestamps, full audit log"],
  ["Dashboard and Indicator API", "Role-based views, briefs, open indicators"],
]

export function DsaBadge({ dsa }: { dsa: DsaStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        dsa === "ok" && "border-primary/30 bg-primary/10 text-primary",
        dsa === "mid" && "border-warning/40 bg-warning/10 text-warning",
        dsa === "no" && "border-destructive/40 text-destructive",
      )}
    >
      {DSA_LABEL[dsa]}
    </Badge>
  )
}

const heldCount = (s: Source) => (s.run ? s.run[0] - s.run[1] : 0)

export function Sources() {
  const { role, sources, syncRuns, setDsa } = useStore()
  const canSync = ROLES[role].sync
  const [syncOpen, setSyncOpen] = useState(false)
  const [heldFor, setHeldFor] = useState<Source | null>(null)

  const dsaControl = (s: Source) =>
    canSync ? (
      <Select value={s.dsa} onValueChange={(v) => setDsa(s.id, v as DsaStatus)}>
        <SelectTrigger size="sm" aria-label={`Agreement status for ${s.agency}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(DSA_LABEL) as DsaStatus[]).map((k) => (
            <SelectItem key={k} value={k}>
              {DSA_LABEL[k]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <DsaBadge dsa={s.dsa} />
    )

  const quality = (s: Source) =>
    s.q === null ? (
      <span className="text-muted-foreground">Not yet connected</span>
    ) : (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Progress value={s.q} className="w-20" aria-label={`Quality ${s.q}%`} />
          <span className="tabular-nums">{s.q}%</span>
        </div>
        {heldCount(s) > 0 && (
          <button type="button" onClick={() => setHeldFor(s)} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            {fmtN(heldCount(s))} records held
          </button>
        )}
      </div>
    )

  const updated = (s: Source) => (
    <>
      <div>{s.upd}</div>
      {s.stale && s.run && (
        <Badge variant="outline" className="mt-1 border-warning/40 bg-warning/10 text-warning">
          Out of date
        </Badge>
      )}
    </>
  )

  return (
    <section aria-labelledby="h-src" className="space-y-6">
      <div>
        <h1 id="h-src" className="text-3xl font-semibold tracking-tight text-primary">
          Where the data comes from
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          AgID does not replace any agency's system. It connects to each one through the Smart Zambia Government Service Bus,
          checks the data, and keeps a versioned, audited copy for reporting.
        </p>
      </div>

      <ol aria-label="Data flow" className="grid gap-2 md:grid-cols-5">
        {PIPELINE.map(([t, d], i) => (
          <li
            key={t}
            className={cn("relative rounded-lg border bg-card p-4", i === PIPELINE.length - 1 && "border-primary bg-primary text-primary-foreground")}
          >
            <span className={cn("text-xs font-semibold", i === PIPELINE.length - 1 ? "opacity-80" : "text-warning")}>Step {i + 1}</span>
            <b className={cn("block font-semibold", i < PIPELINE.length - 1 && "text-primary")}>{t}</b>
            <span className={cn("text-sm", i < PIPELINE.length - 1 && "text-muted-foreground")}>{d}</span>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader className="flex flex-wrap items-center gap-3">
          <div className="mr-auto">
            <CardTitle className="text-xl">Connection status</CardTitle>
            <CardDescription>
              {canSync
                ? "Run every connector now and see what was accepted or held for checking. HQ can also update agreement status."
                : "Only HQ Planning and ICT users can run a sync or update agreement status."}
            </CardDescription>
          </div>
          <Button onClick={() => setSyncOpen(true)} disabled={!canSync}>
            <RefreshCw /> Run sync now
          </Button>
        </CardHeader>
        <CardContent>
          {/* Phones get one card per agency; wider screens get the table. */}
          <ul className="space-y-3 md:hidden">
            {sources.map((s) => (
              <li key={s.id} className="space-y-3 rounded-lg border p-3">
                <div>
                  <b>{s.agency}</b>
                  <div className="text-muted-foreground">{s.sys}</div>
                </div>
                <p className="text-sm">{s.how}</p>
                <dl className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Agreement</dt>
                  <dd>{dsaControl(s)}</dd>
                  <dt className="text-muted-foreground">Last update</dt>
                  <dd>{updated(s)}</dd>
                  <dt className="text-muted-foreground">Quality</dt>
                  <dd>{quality(s)}</dd>
                </dl>
              </li>
            ))}
          </ul>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>Agency and system</TableHead>
                <TableHead>How AgID connects</TableHead>
                <TableHead>Data-sharing agreement</TableHead>
                <TableHead>Last update</TableHead>
                <TableHead>Quality score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="min-w-56 whitespace-normal align-top">
                    <b>{s.agency}</b>
                    <div className="text-muted-foreground">{s.sys}</div>
                  </TableCell>
                  <TableCell className="min-w-56 whitespace-normal align-top">{s.how}</TableCell>
                  <TableCell className="align-top">{dsaControl(s)}</TableCell>
                  <TableCell className="align-top">{updated(s)}</TableCell>
                  <TableCell className="min-w-36 align-top">{quality(s)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sync audit log</CardTitle>
          <CardDescription>Held records are never silently dropped. Saved in this browser for the demo.</CardDescription>
        </CardHeader>
        <CardContent aria-live="polite">
          {syncRuns.length === 0 ? (
            <p className="text-muted-foreground">No sync has been run yet{canSync ? "." : ". Switch to the Planning and M&E role to run one."}</p>
          ) : (
            <ol className="space-y-4">
              {syncRuns.map((run, i) => (
                <li key={run.at + i} className="border-l-2 border-accent pl-3">
                  <div className="font-semibold">
                    Sync run at {run.at} <span className="font-normal text-muted-foreground">by {ROLES[run.by].name}</span>
                  </div>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                    {run.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <SyncDialog open={syncOpen} onClose={() => setSyncOpen(false)} />
      <HeldSheet source={heldFor} onClose={() => setHeldFor(null)} />
    </section>
  )
}

// Plays a sync back one connector at a time, then saves the result.
function SyncDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { planSync, commitSync } = useStore()
  const [plan, setPlan] = useState<SyncPlan | null>(null)
  const [done, setDone] = useState(0)
  const committed = useRef(false)

  useEffect(() => {
    if (!open) return
    committed.current = false
    setPlan(planSync())
    setDone(0)
    // planSync only reads state; running it once per opening is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!plan || done >= plan.lines.length) return
    const id = setTimeout(() => setDone((d) => d + 1), plan.lines[done].outcome === "skipped" ? 250 : 650)
    return () => clearTimeout(id)
  }, [plan, done])

  const finished = !!plan && done >= plan.lines.length
  useEffect(() => {
    if (finished && plan && !committed.current) {
      committed.current = true
      commitSync(plan)
      toast.success(`Sync completed at ${plan.at}`, { description: "Every run is timestamped and kept in the audit log." })
    }
  }, [finished, plan, commitSync])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finished && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton={finished}>
        <DialogHeader>
          <DialogTitle>{finished ? "Sync complete" : "Running sync…"}</DialogTitle>
          <DialogDescription>Each connector is read through the Government Service Bus and checked against the quality rules.</DialogDescription>
        </DialogHeader>
        {plan && (
          <>
            <Progress value={(done / plan.lines.length) * 100} aria-label="Sync progress" />
            <ul className="space-y-2" aria-live="polite">
              {plan.lines.map((l, i) => {
                const state = i < done ? l.outcome : i === done ? "running" : "queued"
                const src = plan.sources.find((s) => s.id === l.sourceId)!
                return (
                  <li key={l.sourceId} className="flex gap-2.5 text-sm">
                    {state === "running" && <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />}
                    {state === "queued" && <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                    {state === "accepted" && <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />}
                    {(state === "nodata" || state === "skipped") && <CircleMinus className="mt-0.5 size-4 shrink-0 text-warning" />}
                    <div>
                      <div className={cn("font-medium", state === "queued" && "text-muted-foreground")}>{src.agency}</div>
                      {i < done && <div className="text-muted-foreground">{l.text.slice(src.agency.length + 2)}</div>}
                      {state === "running" && <div className="text-muted-foreground">Reading and checking records…</div>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <DialogFooter>
          <Button onClick={onClose} disabled={!finished}>
            {finished ? "Done" : "Please wait"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function HeldSheet({ source, onClose }: { source: Source | null; onClose: () => void }) {
  const rows = source ? heldRecords(source) : []
  const total = source ? heldCount(source) : 0
  return (
    <Sheet open={!!source} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-2xl">
        {source && (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl text-primary">Held records: {source.short}</SheetTitle>
              <SheetDescription>
                {fmtN(total)} records from {source.sys} did not pass the quality rules. They are kept, not dropped, and have been sent to
                the {source.short} data steward to correct at source.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-3 px-4 pb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Value received</TableHead>
                    <TableHead>Rule failed</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.id}</TableCell>
                      <TableCell>{r.field}</TableCell>
                      <TableCell className="font-mono text-xs">{r.value || <span className="text-muted-foreground">(empty)</span>}</TableCell>
                      <TableCell className="whitespace-normal">{r.rule}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(r.status === "Corrected" ? "border-primary/30 text-primary" : "border-warning/40 text-warning")}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">
                Showing {rows.length} of {fmtN(total)}. Personal details are never displayed; records are identified by their system ID only.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
