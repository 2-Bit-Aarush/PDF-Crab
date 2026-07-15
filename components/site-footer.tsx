export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-5 py-10">
        <a href="#home" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="size-5" />
          <span className="font-brand text-sm font-semibold tracking-tight text-foreground">
            PDF-Crab
          </span>
        </a>

        <p className="text-center text-xs text-muted-foreground max-w-xs leading-relaxed">
          A knowledge workspace for students who collect more notes than they can read.
        </p>

        <p className="font-brand text-[10px] text-muted-foreground/50">
          © {new Date().getFullYear()} PDF-Crab · build 0.1.0
        </p>
      </div>
    </footer>
  )
}
