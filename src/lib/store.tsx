import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { SOURCES, type AudienceId, type DsaStatus, type MapKey, type RoleId, type Source } from "@/data/demo"
import { fmtDateTime, fmtN } from "@/lib/format"

// Everything the demo remembers lives in one localStorage entry.
// Bump the version when the shape changes so stale saves are discarded.
const STORAGE_KEY = "agid-demo:v1"

export type BriefStep = 0 | 1 | 2
export type BriefEvent = { step: BriefStep; by: RoleId; at: string }
export type BriefState = { step: BriefStep; history: BriefEvent[] }
export type SyncRun = { at: string; by: RoleId; lines: string[] }

type Persisted = {
  role: RoleId
  prov: string
  mapk: MapKey
  sources: Source[]
  syncRuns: SyncRun[]
  briefs: Record<string, BriefState>
}

const DEFAULTS: Persisted = {
  role: "exec",
  prov: "central",
  mapk: "farmers",
  sources: SOURCES,
  syncRuns: [],
  briefs: {},
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Persisted>) }
  } catch {
    return DEFAULTS
  }
}

export const briefKey = (aud: AudienceId, scope: string) => `${aud}:${scope}`
const EMPTY_BRIEF: BriefState = { step: 0, history: [] }

type Store = Persisted & {
  setRole: (r: RoleId) => void
  setProv: (p: string) => void
  setMapk: (k: MapKey) => void
  setDsa: (sourceId: string, dsa: DsaStatus) => void
  runSync: () => SyncRun
  getBrief: (key: string) => BriefState
  advanceBrief: (key: string) => void
  resetBrief: (key: string) => void
  resetAll: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Private mode or blocked storage: the demo still works for this session.
    }
  }, [state])

  const patch = useCallback((p: Partial<Persisted>) => setState((s) => ({ ...s, ...p })), [])

  const store = useMemo<Store>(
    () => ({
      ...state,
      setRole: (role) => patch({ role }),
      setProv: (prov) => patch({ prov }),
      setMapk: (mapk) => patch({ mapk }),
      setDsa: (id, dsa) =>
        setState((s) => ({ ...s, sources: s.sources.map((src) => (src.id === id ? { ...src, dsa } : src)) })),
      runSync: () => {
        const at = fmtDateTime(new Date())
        const lines: string[] = []
        const sources = state.sources.map((src) => {
          if (!src.run) {
            lines.push(
              src.dsa === "ok"
                ? `${src.agency}: agreement signed, connector not yet built.`
                : `${src.agency}: skipped until the data-sharing agreement is signed.`,
            )
            return src
          }
          const [read, accepted, msg] = src.run
          lines.push(`${src.agency}: ${fmtN(read)} records read, ${fmtN(accepted)} accepted. ${msg}`)
          // Sources that delivered new records get a fresh timestamp; empty runs stay stale.
          return read > 0 ? { ...src, upd: at, stale: false } : src
        })
        const run: SyncRun = { at, by: state.role, lines }
        setState((s) => ({ ...s, sources, syncRuns: [run, ...s.syncRuns].slice(0, 20) }))
        return run
      },
      getBrief: (key) => state.briefs[key] ?? EMPTY_BRIEF,
      advanceBrief: (key) =>
        setState((s) => {
          const cur = s.briefs[key] ?? EMPTY_BRIEF
          if (cur.step >= 2) return s
          const step = (cur.step + 1) as BriefStep
          const ev: BriefEvent = { step, by: s.role, at: fmtDateTime(new Date()) }
          return { ...s, briefs: { ...s.briefs, [key]: { step, history: [...cur.history, ev] } } }
        }),
      resetBrief: (key) =>
        setState((s) => {
          const briefs = { ...s.briefs }
          delete briefs[key]
          return { ...s, briefs }
        }),
      resetAll: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
        setState(DEFAULTS)
      },
    }),
    [state, patch],
  )

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const s = useContext(StoreContext)
  if (!s) throw new Error("useStore must be used inside StoreProvider")
  return s
}
