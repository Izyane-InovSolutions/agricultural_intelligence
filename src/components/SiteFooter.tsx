import ministryWordmarkWhite from "@/assets/Ministry-of-agriculture-w.png"
import izyaneLogo from "@/assets/iZyane-white.png"

export function SiteFooter() {
  return (
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
  )
}
