import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DSA_LABEL, ROLES, type DsaStatus } from "@/data/demo"
import { useStore } from "@/lib/store"
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

export function Sources() {
  const { role, sources, syncRuns, runSync, setDsa } = useStore()
  const canSync = ROLES[role].sync

  const onSync = () => {
    const run = runSync()
    toast.success(`Sync run at ${run.at}`, { description: "Every run is timestamped and kept in the audit log." })
  }

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
            className={cn(
              "relative rounded-lg border bg-card p-4",
              i === PIPELINE.length - 1 && "border-primary bg-primary text-primary-foreground",
            )}
          >
            <span className={cn("text-xs font-semibold", i === PIPELINE.length - 1 ? "opacity-80" : "text-warning")}>
              Step {i + 1}
            </span>
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
          <Button onClick={onSync} disabled={!canSync}>
            <RefreshCw /> Run sync now
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
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
                  <TableCell className="align-top">
                    {canSync ? (
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
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <div>{s.upd}</div>
                    {s.stale && s.run && (
                      <Badge variant="outline" className="mt-1 border-warning/40 bg-warning/10 text-warning">
                        Out of date
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="min-w-36 align-top">
                    {s.q === null ? (
                      <span className="text-muted-foreground">Not yet connected</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={s.q} className="w-20" aria-label={`Quality ${s.q}%`} />
                        <span className="tabular-nums">{s.q}%</span>
                      </div>
                    )}
                  </TableCell>
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
    </section>
  )
}
