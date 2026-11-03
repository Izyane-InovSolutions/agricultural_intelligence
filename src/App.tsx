import { useEffect, useState } from "react"
import { Moon, RotateCcw, Sprout, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import { PROVINCES, ROLES, type RoleId } from "@/data/demo"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { Benefits } from "@/views/Benefits"
import { Briefing } from "@/views/Briefing"
import { Indicators } from "@/views/Indicators"
import { Overview } from "@/views/Overview"
import { Sources } from "@/views/Sources"

const VIEWS = {
  overview: { label: "Overview", Component: Overview },
  sources: { label: "Data sources", Component: Sources },
  indicators: { label: "Indicator dictionary", Component: Indicators },
  briefing: { label: "Briefings", Component: Briefing },
  benefits: { label: "Benefits", Component: Benefits },
}
type ViewId = keyof typeof VIEWS

function viewFromHash(): ViewId {
  const h = location.hash.replace("#", "")
  return h in VIEWS ? (h as ViewId) : "overview"
}

function useHashView() {
  const [view, setView] = useState<ViewId>(viewFromHash)
  useEffect(() => {
    const on = () => setView(viewFromHash())
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  return view
}

export default function App() {
  const view = useHashView()
  const { Component } = VIEWS[view]

  return (
    <div className="flex min-h-svh flex-col">
      <Header view={view} />
      <div className="border-b border-accent/30 bg-accent/10 text-sm print:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
          <strong className="text-warning">Demonstration build.</strong> All figures, agency statuses and dates are synthetic and
          illustrative, not official statistics. Changes you make are saved in this browser only.
        </div>
      </div>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Component />
      </main>
      <footer className="border-t bg-primary text-primary-foreground print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm sm:px-6">
          <span className="font-semibold">Ministry of Agriculture, Republic of Zambia</span>
          <span className="opacity-80">
            Prototype prepared by iZyane InovSolutions &amp; Payments for UNDP Zambia RFP UNDP-ZMB-00619 (AA4DPI). Synthetic data only.
          </span>
        </div>
        <div className="h-1.5 bg-accent" />
      </footer>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}

function Header({ view }: { view: ViewId }) {
  const { role, prov, setRole, setProv, resetAll } = useStore()
  const scope = ROLES[role].scope

  return (
    <header className="sticky top-0 z-20 print:hidden">
      <div className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <a href="#overview" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sprout className="size-6" />
            </span>
            <span className="leading-tight">
              <b className="block text-2xl tracking-tight">AgID</b>
              <span className="text-sm opacity-85">Agricultural Intelligence Dashboard, Ministry of Agriculture</span>
            </span>
          </a>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="role" className="opacity-85">
              Signed in as
            </label>
            <Select
              value={role}
              onValueChange={(v) => {
                const next = v as RoleId
                setRole(next)
                if (ROLES[next].scope === "district") setProv("central")
              }}
            >
              <SelectTrigger id="role" size="sm" className="bg-secondary text-secondary-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ROLES) as RoleId[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {ROLES[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {scope !== "national" && (
              <Select value={prov} onValueChange={setProv} disabled={scope === "district"}>
                <SelectTrigger size="sm" aria-label="Province" className="bg-secondary text-secondary-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <ThemeToggle />
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="hover:bg-white/15 hover:text-primary-foreground" aria-label="Reset demo data">
                  <RotateCcw />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset demo data?</DialogTitle>
                  <DialogDescription>
                    This clears the sync log, brief approvals, agreement changes and role selection saved in this browser.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="destructive" onClick={resetAll}>
                      Reset
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      <nav aria-label="Sections" className="border-b bg-card shadow-sm">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {(Object.keys(VIEWS) as ViewId[]).map((v) => (
            <a
              key={v}
              href={`#${v}`}
              aria-current={v === view ? "page" : undefined}
              className={cn(
                "border-b-4 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                v === view
                  ? "border-accent text-primary"
                  : "border-transparent text-muted-foreground hover:border-accent/40 hover:text-primary",
              )}
            >
              {VIEWS[v].label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      className="hover:bg-white/15 hover:text-primary-foreground"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
