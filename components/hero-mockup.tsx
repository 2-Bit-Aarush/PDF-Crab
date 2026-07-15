import { Vault, FileText, Layers, Check } from 'lucide-react'

const vaultItems = [
  { label: 'Organic Chemistry', active: true },
  { label: 'Lecture 04 — Alkenes' },
  { label: 'Tutorial notes.pdf' },
  { label: 'Handwritten set B' },
  { label: 'Past paper 2023' },
]

const sources = ['Lecture 04', 'Tutorial notes', 'Handwritten B', 'Textbook ch.7', 'Past paper']

const timeline = [
  { label: 'Nomenclature', done: true },
  { label: 'Addition reactions', done: true },
  { label: 'Markovnikov rule', done: true },
  { label: 'Reaction mechanisms', done: false },
]

export function HeroMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-2.5 rounded-full bg-secondary" />
        <span className="size-2.5 rounded-full bg-secondary" />
        <span className="size-2.5 rounded-full bg-secondary" />
          <span className="ml-3 text-xs text-muted-foreground">PDF-Crab — Master Note</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[190px_1fr_200px]">
        {/* Vault sidebar */}
        <aside className="hidden flex-col gap-1 border-r border-border p-3 md:flex">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Vault className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Vault</span>
          </div>
          {vaultItems.map((item) => (
            <div
              key={item.label}
              className={`truncate rounded-lg px-2.5 py-2 text-xs ${
                item.active
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </div>
          ))}
        </aside>

        {/* Master Note */}
        <div className="border-b border-border p-5 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-foreground" />
            <span className="text-sm font-semibold text-foreground">Master Note</span>
          </div>
          <div className="mt-4 space-y-2.5">
            <div className="h-3 w-2/5 rounded bg-foreground/20" />
            <div className="h-2.5 w-full rounded bg-secondary" />
            <div className="h-2.5 w-11/12 rounded bg-secondary" />
            <div className="h-2.5 w-4/5 rounded bg-secondary" />
            <div className="my-3 rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-xs text-muted-foreground">
              CH₂=CH₂ + Br₂ → CH₂BrCH₂Br
            </div>
            <div className="h-2.5 w-full rounded bg-secondary" />
            <div className="h-2.5 w-3/4 rounded bg-secondary" />
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="size-3.5 text-accent" />
            No repetition · original wording preserved
          </div>
        </div>

        {/* Right rail: Coverage, Sources, Topic Timeline */}
        <aside className="flex flex-col gap-4 p-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Coverage</span>
              <span className="text-xs font-semibold text-accent">94%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-[94%] rounded-full bg-accent" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Layers className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Sources</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-muted-foreground">
              Topic Timeline
            </span>
            <div className="flex flex-col gap-2.5">
              {timeline.map((t) => (
                <div key={t.label} className="flex items-center gap-2.5">
                  <span
                    className={`size-2 shrink-0 rounded-full ${
                      t.done ? 'bg-accent' : 'border border-border bg-transparent'
                    }`}
                  />
                  <span
                    className={`text-[11px] ${
                      t.done ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
