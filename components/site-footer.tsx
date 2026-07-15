const links = [
  { label: 'GitHub', href: '#github' },
  { label: 'Privacy', href: '#privacy' },
  { label: 'Terms', href: '#terms' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 py-10 sm:flex-row">
        <a href="#home" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="size-5" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">PDF-Crab</span>
        </a>

        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PDF-Crab
        </p>
      </div>
    </footer>
  )
}
