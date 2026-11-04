import { useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { INDICATORS } from "@/data/demo"

export function Indicators() {
  const [q, setQ] = useState("")
  const needle = q.trim().toLowerCase()
  const rows = INDICATORS.filter((r) => !needle || Object.values(r).join(" ").toLowerCase().includes(needle))

  return (
    <section aria-labelledby="h-ind" className="space-y-6">
      <div>
        <h1 id="h-ind" className="text-3xl font-semibold tracking-tight text-primary">
          Indicator dictionary
        </h1>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          One agreed definition per indicator, so the Ministry, FRA and ZamStats never report two different numbers for the same thing.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, source or steward"
            aria-label="Search indicators"
            className="pl-8"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {rows.length} of {INDICATORS.length} indicators
        </span>
      </div>

      {/* Phones get one card per indicator; wider screens get the table. */}
      <ul className="space-y-3 md:hidden">
        {rows.map((r) => (
          <li key={r.name}>
            <Card size="sm">
              <CardContent className="space-y-2">
                <b className="text-base text-primary">{r.name}</b>
                <p>{r.definition}</p>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Unit</dt>
                  <dd>{r.unit}</dd>
                  <dt className="text-muted-foreground">Breakdowns</dt>
                  <dd>{r.breakdowns}</dd>
                  <dt className="text-muted-foreground">How often</dt>
                  <dd>{r.frequency}</dd>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd>{r.source}</dd>
                  <dt className="text-muted-foreground">Steward</dt>
                  <dd>{r.steward}</dd>
                </dl>
              </CardContent>
            </Card>
          </li>
        ))}
        {rows.length === 0 && <li className="py-8 text-center text-muted-foreground">No indicator matches "{q}".</li>}
      </ul>

      <Card className="hidden py-0 md:flex">
        <CardContent className="px-0">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                {["Indicator", "Definition and formula", "Unit", "Breakdowns", "How often", "Source system", "Steward"].map((h) => (
                  <TableHead key={h} className="first:pl-4">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="min-w-44 pl-4 align-top font-semibold whitespace-normal">{r.name}</TableCell>
                  <TableCell className="min-w-64 align-top whitespace-normal">{r.definition}</TableCell>
                  <TableCell className="align-top">{r.unit}</TableCell>
                  <TableCell className="min-w-44 align-top whitespace-normal">{r.breakdowns}</TableCell>
                  <TableCell className="align-top">{r.frequency}</TableCell>
                  <TableCell className="align-top">{r.source}</TableCell>
                  <TableCell className="align-top">{r.steward}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No indicator matches "{q}".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
