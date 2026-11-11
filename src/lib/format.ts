export const fmtN = (n: number) => n.toLocaleString("en-GB")

export function fmtK(n: number) {
  if (n < 1000) return String(n)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k"
}

export function fmtDateTime(d: Date) {
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return `${date}, ${time}`
}

export const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })

// Kwacha amounts held in millions: "ZMW 860 m", "ZMW 6.8 bn".
export const fmtZmwM = (m: number) => (m >= 1000 ? `ZMW ${(m / 1000).toFixed(1).replace(/\.0$/, "")} bn` : `ZMW ${fmtN(m)} m`)
