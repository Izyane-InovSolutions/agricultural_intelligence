import { lazy, Suspense, useEffect, useState } from "react"
import { CircleHelp, Moon, RotateCcw, Sun, WifiOff } from "lucide-react"
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
import ministryLogo from "@/assets/Ministry-of-agriculture-icon.png"
import ministryWordmarkWhite from "@/assets/Ministry-of-agriculture-w.png"
import izyaneLogo from "@/assets/iZyane-white.png"
import { Tour } from "@/components/Tour"
import { PROVINCES, ROLES, type RoleId } from "@/data/demo"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

// Each page is its own download, so the first visit only fetches the page being opened.
const Overview = lazy(() => import("@/views/Overview").then((m) => ({ default: m.Overview })))
const Sources = lazy(() => import("@/views/Sources").then((m) => ({ default: m.Sources })))
const Indicators = lazy(() => import("@/views/Indicators").then((m) => ({ default: m.Indicators })))
const Briefing = lazy(() => import("@/views/Briefing").then((m) => ({ default: m.Briefing })))
const Benefits = lazy(() => import("@/views/Benefits").then((m) => ({ default: m.Benefits })))

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

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(navigator.onLine)
    window.addEventListener("online", on)
    window.addEventListener("offline", on)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", on)
    }
  }, [])
  return online
}

export default function App() {
  const view = useHashView()
  const { Component } = VIEWS[view]
  const { tourSeen, setTourSeen } = useStore()
  // First-time visitors get the tour automatically; afterwards it starts from the header.
  const [tourStep, setTourStep] = useState<number | null>(tourSeen ? null : 0)
  const closeTour = () => {
    setTourStep(null)
    setTourSeen()
  }

  return (
    <div className="flex min-h-svh flex-col">
      <Header view={view} onTour={() => setTourStep(0)} />
      {/* <div className="border-b border-accent/30 bg-accent/10 text-sm print:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
          <strong className="text-warning">Demonstration build.</strong> All figures, agency statuses and dates are synthetic and
          illustrative, not official statistics. Changes you make are saved in this browser only.
        </div>
      </div> */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
          <Component />
        </Suspense>
      </main>
      <footer className="border-t bg-brand text-brand-foreground print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm sm:px-6">
          <img src={ministryWordmarkWhite} alt="Ministry of Agriculture" className="h-12 w-auto" />
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="opacity-80">Prototype prepared by</span>
            <img src={izyaneLogo} alt="iZyane InovSolutions &amp; Payments" className="h-10 w-auto" />
            <span className="opacity-80">for UNDP Zambia RFP UNDP-ZMB-00619 (AA4DPI). Synthetic data only.</span>
          </span>
        </div>
        <div className="h-1.5 bg-accent" />
      </footer>
      <Tour step={tourStep} onStep={setTourStep} onClose={closeTour} />
      <Toaster richColors position="bottom-right" />
    </div>
  )
}

function Header({ view, onTour }: { view: ViewId; onTour: () => void }) {
  const { role, prov, setRole, setProv, resetAll } = useStore()
  const scope = ROLES[role].scope
  const online = useOnline()

  return (
    <header className="sticky top-0 z-20 print:hidden">
      <div className="bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <a href="#overview" className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white p-1 ring-2 ring-accent">
              <img src={ministryLogo} alt="Coat of arms of Zambia" className="size-full object-contain" />
            </span>
            <span className="leading-tight">
              <b className="block text-2xl tracking-tight">AgID</b>
              <span className="text-sm opacity-85">Agricultural Intelligence Dashboard, Ministry of Agriculture</span>
            </span>
          </a>
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            {!online && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                <WifiOff className="size-3.5" /> Offline, showing saved data
              </span>
            )}
            <label htmlFor="role" className="opacity-85">
              Demo: view as
            </label>
            <Select
              value={role}
              onValueChange={(v) => {
                const next = v as RoleId
                setRole(next)
                if (ROLES[next].scope === "district") setProv("central")
              }}
            >
              <SelectTrigger id="role" size="sm" className="bg-white text-neutral-900 dark:bg-white dark:text-neutral-900">
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
                <SelectTrigger size="sm" aria-label="Province" className="bg-white text-neutral-900 dark:bg-white dark:text-neutral-900">
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
            <Button size="sm" variant="ghost" className="text-brand-foreground hover:bg-white/15 hover:text-brand-foreground" onClick={onTour}>
              <CircleHelp /> <span className="hidden sm:inline">Tour</span>
            </Button>
            <ThemeToggle />
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="text-brand-foreground hover:bg-white/15 hover:text-brand-foreground" aria-label="Reset demo data">
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
      className="text-brand-foreground hover:bg-white/15 hover:text-brand-foreground"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  )
}
