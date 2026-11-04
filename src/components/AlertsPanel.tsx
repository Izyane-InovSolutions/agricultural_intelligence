import { useState } from "react"
import { CircleAlert, CircleCheck, Info, MessageSquare, TriangleAlert, UserRound } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ROLES, type RoleId } from "@/data/demo"
import { scopeProvinces } from "@/lib/scope"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type AlertKind = "risk" | "warn" | "info"
type AlertItem = { id: string; kind: AlertKind; title: string; msg: string }

const STYLE = {
  risk: { border: "border-l-destructive", Icon: CircleAlert, icon: "text-destructive" },
  warn: { border: "border-l-warning", Icon: TriangleAlert, icon: "text-warning" },
  info: { border: "border-l-primary", Icon: Info, icon: "text-primary" },
}

function useAlertItems(): AlertItem[] {
  const { role, prov, sources } = useStore()
  const list = scopeProvinces(role, prov)
  const src = (id: string) => sources.find((s) => s.id === id)!
  const out: AlertItem[] = []
  list
    .filter((p) => p.rain < 80)
    .sort((a, b) => a.rain - b.rain)
    .forEach((p) =>
      out.push({ id: `rain:${p.id}`, kind: "risk", title: `Rainfall at ${p.rain}% of normal in ${p.name}`, msg: `ZMD bulletin, ${src("zmd").upd}. Alert threshold: 80%.` }),
    )
  list
    .filter((p) => p.delivery < 70)
    .sort((a, b) => a.delivery - b.delivery)
    .forEach((p) =>
      out.push({ id: `delivery:${p.id}`, kind: "warn", title: `Input delivery at ${p.delivery}% in ${p.name}`, msg: `ZIAMIS e-voucher, ${src("ziamis").upd}. Alert threshold: 70%.` }),
    )
  sources
    .filter((s) => s.stale && s.run)
    .forEach((s) =>
      out.push({ id: `stale:${s.id}`, kind: "warn", title: `${s.agency} data is out of date`, msg: `Last received ${s.upd}. The data steward has been reminded.` }),
    )
  if (ROLES[role].scope === "national") {
    const n = sources.filter((s) => s.dsa === "no").length
    if (n) out.push({ id: "dsa", kind: "info", title: `${n} data-sharing agreement${n === 1 ? "" : "s"} not yet started`, msg: "Track progress in Data sources." })
  }
  return out
}

export function AlertsPanel() {
  const { getAlert } = useStore()
  const items = useAlertItems()
  const [showAcked, setShowAcked] = useState(false)
  const [open, setOpen] = useState<AlertItem | null>(null)
  const acked = items.filter((a) => getAlert(a.id).ack)
  const visible = showAcked ? items : items.filter((a) => !getAlert(a.id).ack)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Needs attention</CardTitle>
        <CardAction>
          <Badge variant={items.length - acked.length ? "default" : "outline"}>{items.length - acked.length} open</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.length === 0 ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <CircleCheck className="size-4 text-primary" />
            {items.length ? "Every alert in this scope has been acknowledged." : "Nothing needs attention in this scope."}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {visible.map((a) => {
              const { border, Icon, icon } = STYLE[a.kind]
              const st = getAlert(a.id)
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(a)}
                    className={cn(
                      "flex w-full gap-2.5 rounded-r-md border-l-4 bg-muted/60 px-3 py-2.5 text-left transition-colors hover:bg-muted",
                      border,
                      st.ack && "opacity-60",
                    )}
                  >
                    <Icon className={cn("mt-0.5 size-4 shrink-0", icon)} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{a.title}</div>
                      <div className="text-sm text-muted-foreground">{a.msg}</div>
                      {(st.ack || st.assignee || st.notes.length > 0) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {st.ack && (
                            <Badge variant="outline" className="border-primary/30 text-primary">
                              <CircleCheck /> Acknowledged
                            </Badge>
                          )}
                          {st.assignee && (
                            <Badge variant="outline">
                              <UserRound /> {ROLES[st.assignee].name}
                            </Badge>
                          )}
                          {st.notes.length > 0 && (
                            <Badge variant="outline">
                              <MessageSquare /> {st.notes.length}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        {acked.length > 0 && (
          <div className="flex items-center gap-2 pt-1 text-sm">
            <Switch id="show-acked" checked={showAcked} onCheckedChange={setShowAcked} />
            <Label htmlFor="show-acked" className="font-normal text-muted-foreground">
              Show {acked.length} acknowledged
            </Label>
          </div>
        )}
      </CardContent>
      <AlertDialog item={open} onClose={() => setOpen(null)} />
    </Card>
  )
}

function AlertDialog({ item, onClose }: { item: AlertItem | null; onClose: () => void }) {
  const { getAlert, ackAlert, assignAlert, noteAlert } = useStore()
  const [draft, setDraft] = useState("")
  const st = item ? getAlert(item.id) : null

  const addNote = () => {
    if (!item || !draft.trim()) return
    noteAlert(item.id, draft.trim())
    setDraft("")
  }

  return (
    <Dialog
      open={!!item}
      onOpenChange={(o) => {
        if (!o) {
          setDraft("")
          onClose()
        }
      }}
    >
      {item && st && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>{item.msg}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="assignee">Assigned to</Label>
              <Select value={st.assignee ?? "none"} onValueChange={(v) => assignAlert(item.id, v === "none" ? undefined : (v as RoleId))}>
                <SelectTrigger id="assignee" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {(Object.keys(ROLES) as RoleId[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {ROLES[k].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Notes</Label>
              {st.notes.length > 0 && (
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {st.notes.map((n, i) => (
                    <li key={i} className="rounded-md bg-muted px-3 py-2 text-sm">
                      <div className="text-xs text-muted-foreground">
                        {ROLES[n.by].name}, {n.at}
                      </div>
                      {n.text}
                    </li>
                  ))}
                </ul>
              )}
              <Textarea id="note" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What is being done about this?" rows={2} />
              <Button size="sm" variant="outline" onClick={addNote} disabled={!draft.trim()}>
                Add note
              </Button>
            </div>

            {st.ack && (
              <p className="text-sm text-muted-foreground">
                Acknowledged by {ROLES[st.ack.by].name}, {st.ack.at}.
              </p>
            )}
          </div>

          <DialogFooter>
            {st.ack ? (
              <Button variant="outline" onClick={() => ackAlert(item.id, false)}>
                Reopen
              </Button>
            ) : (
              <Button
                onClick={() => {
                  ackAlert(item.id, true)
                  toast.success("Alert acknowledged")
                  onClose()
                }}
              >
                <CircleCheck /> Acknowledge
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
