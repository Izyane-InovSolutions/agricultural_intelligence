import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { changePct } from "@/lib/kpis"
import { cn } from "@/lib/utils"

export function Change({ now, before, higherIsBetter }: { now: number; before: number; higherIsBetter: boolean }) {
  const pct = changePct(now, before)
  const good = pct === 0 ? null : pct > 0 === higherIsBetter
  const Icon = pct >= 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
        good === true && "text-primary",
        good === false && "text-destructive",
        good === null && "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  )
}
