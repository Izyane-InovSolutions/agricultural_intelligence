import { Card, CardContent } from "@/components/ui/card"
import { BENEFITS } from "@/data/demo"

export function Benefits() {
  return (
    <section aria-labelledby="h-be" className="space-y-6">
      <div>
        <h1 id="h-be" className="text-3xl font-semibold tracking-tight text-primary">
          What changes for the Ministry
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          The baseline is measured during inception, so the Ministry can prove the savings at handover. The figures below are
          illustrative targets.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-3 w-5 rounded-sm bg-muted-foreground/40" /> Today (illustrative)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-3 w-5 rounded-sm bg-primary" /> With AgID (target)
            </span>
          </div>
          {BENEFITS.map(([label, before, after, unit]) => {
            const mx = Math.max(before, after) || 1
            const bar = (v: number, cls: string, lab: string) => (
              <div className="flex items-center gap-3 text-sm">
                <i className={`block h-4 shrink-0 rounded-sm ${cls}`} style={{ width: `${Math.max(3, (v / mx) * 70)}%` }} />
                <span className="whitespace-nowrap">
                  {lab}: <b className="tabular-nums">{v}</b> {unit}
                </span>
              </div>
            )
            return (
              <div key={label} className="grid items-center gap-3 md:grid-cols-[260px_1fr]">
                <b>{label}</b>
                <div className="flex flex-col gap-1.5">
                  {bar(before, "bg-muted-foreground/40", "Today")}
                  {bar(after, "bg-primary", "With AgID")}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </section>
  )
}
