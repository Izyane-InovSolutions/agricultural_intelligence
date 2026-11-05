import type { RoleId } from "@/data/demo"

// Demo sign-in accounts, one per role. There is no server: the password is checked in the browser.
export type Account = { id: string; email: string; name: string; role: RoleId; prov: string; place: string }

export const DEMO_PASSWORD = "agid2026"

export const ACCOUNTS: Account[] = [
  { id: "ps", email: "ps@agid.demo", name: "Permanent Secretary", role: "exec", prov: "central", place: "Mulungushi House, Lusaka" },
  { id: "pme", email: "planning@agid.demo", name: "Chanda Mwila", role: "hq", prov: "central", place: "Planning and M&E, HQ" },
  { id: "pac", email: "pac.southern@agid.demo", name: "Mutinta Hamweemba", role: "prov", prov: "southern", place: "Southern Province, Choma" },
  { id: "dac", email: "dac.chibombo@agid.demo", name: "Bwalya Phiri", role: "dist", prov: "central", place: "Chibombo District, Central" },
]

export const accountById = (id: string) => ACCOUNTS.find((a) => a.id === id)

export function checkSignIn(email: string, password: string): Account | null {
  const a = ACCOUNTS.find((x) => x.email === email.trim().toLowerCase())
  return a && password === DEMO_PASSWORD ? a : null
}
