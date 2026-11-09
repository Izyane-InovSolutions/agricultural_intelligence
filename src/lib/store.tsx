import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { SOURCES, type AudienceId, type DsaStatus, type MapKey, type RoleId, type Source } from "@/data/demo"
import { accountById, type Account } from "@/data/accounts"
import { fmtDateTime, fmtN } from "@/lib/format"

// Everything the demo remembers lives in one localStorage entry.
// Bump the version when the shape changes so stale saves are discarded.
const STORAGE_KEY = "agid-demo:v2"

export type BriefStep = 0 | 1 | 2
export type BriefEventKind = "checked" | "approved" | "returned" | "edited" | "restarted"
export type BriefEvent = { kind: BriefEventKind; by: RoleId; at: string; comment?: string }
export type BriefState = { step: BriefStep; history: BriefEvent[]; messages?: string[] }

export type SyncOutcome = "accepted" | "nodata" | "skipped"
export type SyncLine = { sourceId: string; outcome: SyncOutcome; text: string }
export type SyncRun = { at: string; by: RoleId; lines: string[] }
export type SyncPlan = { at: string; lines: SyncLine[]; sources: Source[] }

export type Note = { by: RoleId; at: string; text: string }
export type Session = { accountId: string; at: string }
export type AlertState = { ack?: { by: RoleId; at: string }; assignee?: RoleId; notes: Note[] }

type Persisted = {
  role: RoleId
  prov: string
  // The district a District Agriculture Coordinator is looking after.
  dist: string
  mapk: MapKey
  mapView: "map" | "table"
  sources: Source[]
  syncRuns: SyncRun[]
  briefs: Record<string, BriefState>
  alerts: Record<string, AlertState>
  tourSeen: boolean
  session: Session | null
}

const DEFAULTS: Persisted = {
  role: "exec",
  prov: "central",
  dist: "chibombo",
  mapk: "farmers",
  mapView: "map",
  sources: SOURCES,
  syncRuns: [],
  briefs: {},
  alerts: {},
  tourSeen: false,
  session: null,
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
const EMPTY_ALERT: AlertState = { notes: [] }

type Store = Persisted & {
  setRole: (r: RoleId) => void
  setProv: (p: string) => void
  setDist: (d: string) => void
  setMapk: (k: MapKey) => void
  setMapView: (v: "map" | "table") => void
  setDsa: (sourceId: string, dsa: DsaStatus) => void
  planSync: () => SyncPlan
  commitSync: (plan: SyncPlan) => void
  getBrief: (key: string) => BriefState
  advanceBrief: (key: string) => void
  returnBrief: (key: string, comment: string) => void
  editBrief: (key: string, messages: string[] | undefined) => void
  resetBrief: (key: string) => void
  getAlert: (id: string) => AlertState
  ackAlert: (id: string, ack: boolean) => void
  assignAlert: (id: string, assignee: RoleId | undefined) => void
  noteAlert: (id: string, text: string) => void
  setTourSeen: () => void
  signIn: (a: Account) => void
  signOut: () => void
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

  const store = useMemo<Store>(() => {
    const stamp = () => fmtDateTime(new Date())
    const updateBrief = (key: string, fn: (b: BriefState) => BriefState) =>
      setState((s) => ({ ...s, briefs: { ...s.briefs, [key]: fn(s.briefs[key] ?? EMPTY_BRIEF) } }))
    const updateAlert = (id: string, fn: (a: AlertState) => AlertState) =>
      setState((s) => ({ ...s, alerts: { ...s.alerts, [id]: fn(s.alerts[id] ?? EMPTY_ALERT) } }))

    return {
      ...state,
      setRole: (role) => patch({ role }),
      setProv: (prov) => patch({ prov }),
      setDist: (dist) => patch({ dist }),
      setMapk: (mapk) => patch({ mapk }),
      setMapView: (mapView) => patch({ mapView }),
      setDsa: (id, dsa) =>
        setState((s) => ({ ...s, sources: s.sources.map((src) => (src.id === id ? { ...src, dsa } : src)) })),

      // Works out what a sync would do without changing anything, so the UI can play it back step by step.
      planSync: () => {
        const at = stamp()
        const lines: SyncLine[] = []
        const sources = state.sources.map((src) => {
          if (!src.run) {
            const text =
              src.dsa === "ok"
                ? `${src.agency}: agreement signed, connector not yet built.`
                : `${src.agency}: skipped until the data-sharing agreement is signed.`
            lines.push({ sourceId: src.id, outcome: "skipped", text })
            return src
          }
          const [read, accepted, msg] = src.run
          lines.push({
            sourceId: src.id,
            outcome: read > 0 ? "accepted" : "nodata",
            text: `${src.agency}: ${fmtN(read)} records read, ${fmtN(accepted)} accepted. ${msg}`,
          })
          // Sources that delivered new records get a fresh timestamp; empty runs stay stale.
          return read > 0 ? { ...src, upd: at, stale: false } : src
        })
        return { at, lines, sources }
      },
      commitSync: (plan) =>
        setState((s) => ({
          ...s,
          sources: plan.sources,
          syncRuns: [{ at: plan.at, by: s.role, lines: plan.lines.map((l) => l.text) }, ...s.syncRuns].slice(0, 20),
        })),

      getBrief: (key) => state.briefs[key] ?? EMPTY_BRIEF,
      advanceBrief: (key) =>
        updateBrief(key, (b) =>
          b.step >= 2
            ? b
            : {
                ...b,
                step: (b.step + 1) as BriefStep,
                history: [...b.history, { kind: b.step === 0 ? "checked" : "approved", by: state.role, at: stamp() }],
              },
        ),
      returnBrief: (key, comment) =>
        updateBrief(key, (b) => ({
          ...b,
          step: 0,
          history: [...b.history, { kind: "returned", by: state.role, at: stamp(), comment }],
        })),
      editBrief: (key, messages) =>
        updateBrief(key, (b) => ({
          ...b,
          messages,
          history: [...b.history, { kind: "edited", by: state.role, at: stamp(), comment: messages ? undefined : "Reset to generated text" }],
        })),
      resetBrief: (key) =>
        updateBrief(key, (b) => ({ step: 0, history: [...b.history, { kind: "restarted", by: state.role, at: stamp() }] })),

      getAlert: (id) => state.alerts[id] ?? EMPTY_ALERT,
      ackAlert: (id, ack) => updateAlert(id, (a) => ({ ...a, ack: ack ? { by: state.role, at: stamp() } : undefined })),
      assignAlert: (id, assignee) => updateAlert(id, (a) => ({ ...a, assignee })),
      noteAlert: (id, text) => updateAlert(id, (a) => ({ ...a, notes: [...a.notes, { by: state.role, at: stamp(), text }] })),

      setTourSeen: () => patch({ tourSeen: true }),
      signIn: (a) => patch({ session: { accountId: a.id, at: stamp() }, role: a.role, prov: a.prov, dist: a.dist ?? DEFAULTS.dist }),
      signOut: () => patch({ session: null }),
      resetAll: () => {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // ignore
        }
        // Keep the tour from popping up again straight after a reset, and keep the user signed in.
        setState((s) => {
          const a = s.session && accountById(s.session.accountId)
          return { ...DEFAULTS, tourSeen: true, session: s.session, ...(a && { role: a.role, prov: a.prov, dist: a.dist ?? DEFAULTS.dist }) }
        })
      },
    }
  }, [state, patch])

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const s = useContext(StoreContext)
  if (!s) throw new Error("useStore must be used inside StoreProvider")
  return s
}
