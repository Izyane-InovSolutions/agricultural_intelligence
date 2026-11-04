export const fmtN = (n: number) => n.toLocaleString("en-GB")

export function fmtK(n: number) {
  if (n < 1000) return String(n)
  return (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "") + "k"
}

export function fmtDateTime(d: Date) {
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return `${date}, ${time}`
}

export const fmtDate = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
