import { useEffect } from "react"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { RoleId } from "@/data/demo"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type Step = { view: string; role: RoleId; title: string; body: string }

const STEPS: Step[] = [
  {
    view: "overview",
    role: "exec",
    title: "The national picture",
    body: "As Permanent Secretary you see every headline figure, where it came from and how fresh it is. Select a figure for its trend and breakdown, or a province on the map.",
  },
  {
    view: "sources",
    role: "hq",
    title: "Pull in the latest data",
    body: "Planning and M&E runs the sync. Press “Run sync now” to watch each agency connector, then open “records held” to see what failed the quality rules.",
  },
  {
    view: "briefing",
    role: "hq",
    title: "Check the draft brief",
    body: "The brief is generated from the same data. Planning and M&E can edit the key messages, then press “Mark as checked”.",
  },
  {
    view: "briefing",
    role: "exec",
    title: "Approve or send back",
    body: "The Permanent Secretary approves the checked brief, or sends it back with a comment. Every step is recorded in the activity log.",
  },
  {
    view: "overview",
    role: "prov",
    title: "Each role sees its own area",
    body: "A Provincial Agriculture Coordinator only sees their province, and budget figures are hidden. Use “Demo: view as” to switch roles at any time.",
  },
]

export function Tour({ step, onStep, onClose }: { step: number | null; onStep: (n: number) => void; onClose: () => void }) {
  const { setRole } = useStore()
  const s = step === null ? null : STEPS[step]

  useEffect(() => {
    if (!s) return
    setRole(s.role)
    if (location.hash !== "#" + s.view) location.hash = s.view
    window.scrollTo({ top: 0, behavior: "smooth" })
    // Only react to the step changing; setRole is stable enough for a demo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  if (step === null || !s) return null
  const last = step === STEPS.length - 1

  return (
    <div
      role="dialog"
      aria-labelledby="tour-title"
      className="fixed inset-x-4 bottom-4 z-40 rounded-xl border-t-4 border-t-accent bg-card p-4 shadow-2xl ring-1 ring-foreground/10 sm:right-auto sm:left-6 sm:w-[26rem] print:hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-warning">
            Guided tour · {step + 1} of {STEPS.length}
          </div>
          <h2 id="tour-title" className="mt-0.5 text-lg font-semibold text-primary">
            {s.title}
          </h2>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={onClose} aria-label="Close tour">
          <X />
        </Button>
      </div>
      <p className="mt-1 text-sm">{s.body}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex gap-1" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-5 rounded-full", i <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <Button size="sm" variant="outline" onClick={() => onStep(step - 1)}>
              <ArrowLeft /> Back
            </Button>
          )}
          <Button size="sm" onClick={() => (last ? onClose() : onStep(step + 1))}>
            {last ? "Finish" : "Next"} {!last && <ArrowRight />}
          </Button>
        </div>
      </div>
    </div>
  )
}
