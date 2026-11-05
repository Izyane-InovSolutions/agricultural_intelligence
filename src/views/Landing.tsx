import { useRef, useState, type FormEvent, type RefObject } from "react"
import { ArrowRight, CircleAlert, Database, Eye, EyeOff, FileCheck2, LoaderCircle, LogIn, ShieldCheck, Workflow } from "lucide-react"
import { toast } from "sonner"
import ministryLogo from "@/assets/Ministry-of-agriculture-icon.png"
import { SiteFooter } from "@/components/SiteFooter"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ACCOUNTS, checkSignIn, DEMO_PASSWORD } from "@/data/accounts"
import { BENEFITS, ROLES, SOURCES } from "@/data/demo"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const FEATURES = [
  { Icon: Database, title: `${SOURCES.length} agency sources, one pipeline`, body: "ZIAMIS, FRA, ZMD, ZamStats and more, checked against the same quality rules." },
  { Icon: ShieldCheck, title: "The right view for every role", body: "National, provincial and district staff each see their own area." },
  { Icon: FileCheck2, title: "Briefs drafted from the data", body: "Cabinet and Parliamentary briefs are checked and approved in one place." },
]

const STEPS = [
  { Icon: Workflow, title: "Connect", body: "Agency data arrives through connectors covered by data-sharing agreements." },
  { Icon: ShieldCheck, title: "Check", body: "Records that fail quality rules are held and sent back to the data steward." },
  { Icon: FileCheck2, title: "Brief", body: "Planning and M&E checks the generated brief and the Permanent Secretary approves it." },
]

export function Landing() {
  const emailRef = useRef<HTMLInputElement>(null)
  const goToForm = () => {
    emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    emailRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="bg-brand text-brand-foreground">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white p-1 ring-2 ring-accent">
            <img src={ministryLogo} alt="Coat of arms of Zambia" className="size-full object-contain" />
          </span>
          <span className="leading-tight">
            <b className="block text-2xl tracking-tight">AgID</b>
            <span className="hidden text-sm opacity-85 sm:inline">Agricultural Intelligence Dashboard, Ministry of Agriculture</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 lg:hidden" onClick={goToForm}>
              <LogIn /> Sign in
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-brand text-brand-foreground">
          {/* Soft light behind the headline; purely decorative. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(60rem 30rem at 15% 0%, oklch(1 0 0 / 0.1), transparent 60%)" }}
          />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pt-10 pb-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:pt-16 lg:pb-20">
            <div>
              <p className="text-sm font-semibold tracking-wide text-accent uppercase">Ministry of Agriculture · Republic of Zambia</p>
              <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                One trusted picture of every farming season.
              </h1>
              <p className="mt-4 max-w-xl text-lg opacity-90">
                AgID brings the Ministry's data together, shows where each number came from, and turns it into briefs leaders can act
                on.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {FEATURES.map(({ Icon, title, body }) => (
                  <li key={title} className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
                    <Icon className="size-5 text-accent" />
                    <div className="mt-2 font-semibold">{title}</div>
                    <p className="mt-1 text-sm opacity-85">{body}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
                {BENEFITS.slice(0, 2).map(([label, before, after, unit]) => (
                  <div key={label}>
                    <dt className="text-sm opacity-80">{label}</dt>
                    <dd className="mt-0.5 text-2xl font-semibold tabular-nums">
                      {before} <ArrowRight className="inline size-5 text-accent" aria-label="down to" /> {after}{" "}
                      <span className="text-base font-normal opacity-80">{unit}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <SignInCard emailRef={emailRef} />
          </div>
          <div className="h-1.5 bg-accent" />
        </section>

        <section aria-labelledby="h-how" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 id="h-how" className="text-2xl font-semibold tracking-tight text-primary">
            How AgID works
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ Icon, title, body }, i) => (
              <li key={title}>
                <Card className="h-full border-t-4 border-t-primary">
                  <CardContent className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-warning">Step {i + 1}</div>
                      <div className="text-lg font-semibold">{title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function SignInCard({ emailRef }: { emailRef: RefObject<HTMLInputElement | null> }) {
  const { signIn } = useStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError("Enter your email address and password.")
      return
    }
    setError("")
    setBusy(true)
    // A short pause so signing in feels like a real request.
    window.setTimeout(() => {
      const account = checkSignIn(email, password)
      setBusy(false)
      if (!account) {
        setError("That email address and password don't match an account.")
        return
      }
      location.hash = "overview"
      signIn(account)
      toast.success(`Welcome, ${account.name}`)
    }, 600)
  }

  return (
    <Card id="sign-in" className="w-full border-t-4 border-t-accent shadow-2xl lg:max-w-md lg:justify-self-end">
      <CardHeader>
        <CardTitle className="text-2xl text-primary">Sign in</CardTitle>
        <CardDescription>Use your Ministry account to open the dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              ref={emailRef}
              id="email"
              type="email"
              autoComplete="username"
              placeholder="name@agid.demo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
                className="pr-10"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow((s) => !s)}
              >
                {show ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" /> : <LogIn />} {busy ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">Forgotten your password? Contact the Ministry ICT help desk.</p>
        </form>

        <div className="space-y-2 rounded-lg bg-muted/60 p-3">
          <div className="text-sm font-semibold">Demo accounts</div>
          <p className="text-xs text-muted-foreground">
            Select one to fill in the form. The password for all of them is <code className="font-semibold">{DEMO_PASSWORD}</code>.
          </p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {ACCOUNTS.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(a.email)
                    setPassword(DEMO_PASSWORD)
                    setError("")
                  }}
                  className={cn(
                    "w-full cursor-pointer rounded-md border bg-card px-2.5 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5",
                    email === a.email && "border-primary bg-primary/5",
                  )}
                >
                  <span className="block font-medium">{ROLES[a.role].label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{a.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
