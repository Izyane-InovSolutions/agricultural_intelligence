import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
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
