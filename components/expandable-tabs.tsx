'use client'

// Placeholder navigation component.
// This will be replaced manually with a custom implementation.
const items = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing', badge: 'Soon' },
  { label: 'GitHub', href: '#github' },
]

export function ExpandableTabs() {
  return (
    <nav
      aria-label="Primary"
      className="flex items-center gap-1 rounded-2xl border border-border bg-card/80 px-2 py-1.5 backdrop-blur"
    >
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {item.label}
          {item.badge ? (
            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {item.badge}
            </span>
          ) : null}
        </a>
      ))}
    </nav>
  )
}
