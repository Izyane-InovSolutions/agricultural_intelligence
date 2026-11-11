// Synthetic, illustrative data only. Not official statistics.

export type Province = {
  id: string
  name: string
  short: string
  x: number
  y: number
  farmers: number
  women: number
  delivery: number
  rain: number
  fra: number
  price: number
}

// Any area with figures: a province or a district.
export type Area = Omit<Province, "x" | "y" | "short"> & { short?: string }
export type District = Area & { prov: string }

export type DsaStatus = "ok" | "mid" | "no"

export type Source = {
  id: string
  agency: string
  short: string
  sys: string
  how: string
  dsa: DsaStatus
  upd: string
  stale: boolean
  q: number | null
  run: [read: number, accepted: number, message: string] | null
}

export type Indicator = {
  name: string
  definition: string
  unit: string
  breakdowns: string
  frequency: string
  source: string
  steward: string
}

export type RoleId = "exec" | "hq" | "prov" | "dist"
export type Role = {
  name: string
  label: string
  scope: "national" | "province" | "district"
  budget: boolean
  sync: boolean
  brief: "approve" | "check" | "view"
}

export const PROVINCES: Province[] = [
  { id: "luapula", name: "Luapula", short: "Luapula", x: 1, y: 0, farmers: 96200, women: 44, delivery: 61, rain: 104, fra: 9100, price: 230 },
  { id: "northern", name: "Northern", short: "Northern", x: 2, y: 0, farmers: 132500, women: 42, delivery: 70, rain: 101, fra: 41200, price: 215 },
  { id: "muchinga", name: "Muchinga", short: "Muchinga", x: 3, y: 0, farmers: 88300, women: 40, delivery: 73, rain: 98, fra: 34600, price: 205 },
  { id: "northwestern", name: "North-Western", short: "N-Western", x: 0, y: 1, farmers: 64100, women: 43, delivery: 77, rain: 95, fra: 7800, price: 240 },
  { id: "copperbelt", name: "Copperbelt", short: "Copperbelt", x: 1, y: 1, farmers: 72400, women: 39, delivery: 88, rain: 97, fra: 18300, price: 245 },
  { id: "central", name: "Central", short: "Central", x: 2, y: 1, farmers: 158400, women: 41, delivery: 84, rain: 92, fra: 62300, price: 210 },
  { id: "eastern", name: "Eastern", short: "Eastern", x: 3, y: 1, farmers: 241700, women: 45, delivery: 79, rain: 86, fra: 95400, price: 195 },
  { id: "western", name: "Western", short: "Western", x: 0, y: 2, farmers: 91300, women: 46, delivery: 66, rain: 74, fra: 6200, price: 250 },
  { id: "southern", name: "Southern", short: "Southern", x: 1, y: 2, farmers: 176900, women: 42, delivery: 82, rain: 68, fra: 47100, price: 225 },
  { id: "lusaka", name: "Lusaka", short: "Lusaka", x: 2, y: 2, farmers: 48600, women: 38, delivery: 91, rain: 81, fra: 11400, price: 260 },
]

export const SOURCES: Source[] = [
  { id: "ziamis", agency: "Ministry of Agriculture", short: "MoA", sys: "ZIAMIS farmer registry and e-voucher", how: "REST API through the GSB (API to be specified with the ZIAMIS team)", dsa: "ok", upd: "2 Nov 2026, 06:00", stale: false, q: 96, run: [1166400, 1164100, "2,300 records held: district code not in the reference list. Sent to the ZIAMIS data steward."] },
  { id: "fra", agency: "Food Reserve Agency", short: "FRA", sys: "Crop marketing and depot records", how: "Read-only database view, refreshed nightly", dsa: "mid", upd: "2 Nov 2026, 02:00", stale: false, q: 91, run: [18420, 18208, "212 records held: depot code missing. Sent to the FRA data steward."] },
  { id: "zmd", agency: "Zambia Meteorological Department", short: "ZMD", sys: "Dekadal rainfall bulletins", how: "REST API through the GSB", dsa: "ok", upd: "1 Nov 2026, 18:00", stale: false, q: 98, run: [1160, 1160, "All records accepted."] },
  { id: "zamstats", agency: "Zambia Statistics Agency", short: "ZamStats", sys: "Monthly food price survey", how: "Scheduled secure file transfer (SFTP)", dsa: "mid", upd: "22 Sep 2026", stale: true, q: 88, run: [0, 0, "No new file since 22 Sep 2026. Steward reminded automatically."] },
  { id: "mof", agency: "Ministry of Finance", short: "MoF", sys: "IFMIS budget execution", how: "Read-only database view, refreshed monthly", dsa: "no", upd: "31 Oct 2026", stale: false, q: 93, run: [4210, 4210, "All records accepted."] },
  { id: "mcdss", agency: "Ministry of Community Development and Social Services", short: "MCDSS", sys: "Social cash transfer register", how: "Totals only, pseudonymised at source. No individual records leave MCDSS.", dsa: "no", upd: "Awaiting agreement", stale: true, q: null, run: null },
  { id: "mgee", agency: "Ministry of Green Economy and Environment", short: "MGEE", sys: "Climate-smart agriculture records", how: "Interim spreadsheet upload, moving to API", dsa: "no", upd: "15 Oct 2026", stale: false, q: 79, run: [640, 598, "42 rows held: season label not in the agreed calendar. Sent to the MGEE steward."] },
]

export const DSA_LABEL: Record<DsaStatus, string> = {
  ok: "Signed",
  mid: "Draft with legal teams",
  no: "Not started",
}

export const INDICATORS: Indicator[] = [
  { name: "Registered farmers", definition: "Count of farmers with an active ZIAMIS record for the season.", unit: "farmers", breakdowns: "Province, district, sex, farmer category", frequency: "Each season", source: "ZIAMIS", steward: "MoA, ZIAMIS unit" },
  { name: "Women among registered farmers", definition: "Women registered ÷ all registered farmers × 100.", unit: "%", breakdowns: "Province, district, farmer category", frequency: "Each season", source: "ZIAMIS", steward: "MoA, Planning and M&E" },
  { name: "Input delivery rate", definition: "Input packs redeemed ÷ packs planned for the season × 100.", unit: "%", breakdowns: "Province, district, input type", frequency: "Weekly in season", source: "ZIAMIS e-voucher", steward: "MoA, ZIAMIS unit" },
  { name: "Rainfall against normal", definition: "Season-to-date rainfall ÷ long-term average for the same dekads × 100.", unit: "%", breakdowns: "Province, district", frequency: "Every 10 days", source: "ZMD bulletins", steward: "ZMD" },
  { name: "FRA maize purchases", definition: "Tonnes of maize bought by FRA in the marketing season.", unit: "tonnes", breakdowns: "Province, depot", frequency: "Weekly in marketing season", source: "FRA depot records", steward: "FRA" },
  { name: "Average maize grain price", definition: "Mean retail price of a 50 kg bag of maize grain across surveyed markets.", unit: "ZMW per 50 kg", breakdowns: "Province", frequency: "Monthly", source: "ZamStats price survey", steward: "ZamStats" },
  { name: "Programme budget released", definition: "Funds released ÷ funds allocated to agriculture programmes × 100.", unit: "%", breakdowns: "Programme", frequency: "Monthly", source: "IFMIS", steward: "MoF and MoA Finance" },
  { name: "Farm households receiving social transfers", definition: "Households in both the farmer registry and the transfer register, matched at source and reported as totals only.", unit: "households", breakdowns: "Province, district", frequency: "Quarterly", source: "MCDSS register (totals)", steward: "MCDSS" },
  { name: "Area under climate-smart practices", definition: "Hectares farmed with conservation agriculture or agroforestry.", unit: "hectares", breakdowns: "Province, district, practice", frequency: "Each season", source: "MGEE records", steward: "MGEE" },
  { name: "Brief turnaround", definition: "Days from data request to an approved brief.", unit: "days", breakdowns: "Audience", frequency: "Each brief", source: "AgID workflow log", steward: "MoA, Planning and M&E" },
]

export const ROLES: Record<RoleId, Role> = {
  exec: { name: "Permanent Secretary", label: "Permanent Secretary (Executive)", scope: "national", budget: true, sync: false, brief: "approve" },
  hq: { name: "Planning and M&E, HQ", label: "Planning and M&E, HQ", scope: "national", budget: true, sync: true, brief: "check" },
  prov: { name: "Provincial Agriculture Coordinator", label: "Provincial Agriculture Coordinator", scope: "province", budget: false, sync: false, brief: "view" },
  dist: { name: "District Agriculture Coordinator", label: "District Agriculture Coordinator", scope: "district", budget: false, sync: false, brief: "view" },
}

// Agriculture programme budget for the year, in millions of kwacha (synthetic).
export type BudgetLine = { programme: string; note: string; allocated: number; released: number }
export const BUDGET: BudgetLine[] = [
  { programme: "Farmer Input Support Programme", note: "Seed and fertiliser, e-voucher", allocated: 6800, released: 4400 },
  { programme: "Food reserves and crop marketing", note: "FRA maize purchases and storage", allocated: 3900, released: 2110 },
  { programme: "Irrigation development", note: "Schemes, dams and boreholes", allocated: 1250, released: 410 },
  { programme: "Extension and farmer training", note: "Camp officers, demonstration plots", allocated: 860, released: 470 },
  { programme: "Agricultural research", note: "ZARI seed and soil research", allocated: 540, released: 260 },
  { programme: "Management and support services", note: "Staff, transport, systems", allocated: 650, released: 470 },
]
export const BUDGET_ALLOCATED = BUDGET.reduce((a, b) => a + b.allocated, 0)
export const BUDGET_DISBURSED = BUDGET.reduce((a, b) => a + b.released, 0)
// The headline figure on the Budget released card.
export const BUDGET_RELEASED = Math.round((BUDGET_DISBURSED / BUDGET_ALLOCATED) * 100)

export type MapKey = "farmers" | "delivery" | "rain" | "fra"

export const AUDIENCES = {
  cab: "Cabinet",
  parl: "Parliamentary Committee on Agriculture",
  cp: "Cooperating Partners Group on Agriculture",
} as const
export type AudienceId = keyof typeof AUDIENCES

export const BENEFITS: [label: string, before: number, after: number, unit: string][] = [
  ["Staff days to prepare one Cabinet brief", 10, 1, "days"],
  ["Separate data requests per briefing cycle", 24, 3, "requests"],
  ["Days from question to approved answer", 14, 1, "days"],
  ["Conflicting figures found per brief", 5, 0, "figures"],
]
