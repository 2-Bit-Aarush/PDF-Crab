import { PixelProgress } from '@/components/pixel-progress'
import { PixelFolderIcon, PixelMasterNoteIcon, PixelPdfIcon } from '@/components/pixel-icons'

const sources = ['Lecture 04', 'Tutorial notes', 'Handwritten B', 'Textbook ch.7']

const timeline = [
  { label: 'Nomenclature', done: true },
  { label: 'Addition reactions', done: true },
  { label: 'Markovnikov rule', done: true },
  { label: 'Reaction mechanisms', done: false },
]

export function HeroMockup() {
  return (
    <div className="overflow-hidden rounded-[3px] border border-border bg-[#0a0b0e]">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="font-brand text-[10px] text-muted-foreground tracking-wide">
          Organic Chemistry · Master Note
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <PixelMasterNoteIcon className="size-5 text-accent/70" />
          <span className="text-sm font-semibold text-foreground">Alkenes — compiled</span>
        </div>

        <div className="space-y-2">
          <div className="h-2.5 w-2/5 rounded-[2px] bg-foreground/15" />
          <div className="h-2 w-full rounded-[2px] bg-secondary" />
          <div className="h-2 w-11/12 rounded-[2px] bg-secondary" />
          <div className="my-3 rounded-[3px] border border-border/50 bg-secondary/50 px-3 py-2 font-brand text-[11px] text-muted-foreground">
            CH₂=CH₂ + Br₂ → CH₂BrCH₂Br
          </div>
          <div className="h-2 w-4/5 rounded-[2px] bg-secondary" />
        </div>

        <div className="mt-6 pt-5 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Coverage</span>
            <span className="text-xs font-semibold text-accent">94%</span>
          </div>
          <PixelProgress value={94} maxBlocks={10} className="text-[11px]" />
        </div>

        <div className="mt-5">
          <span className="text-xs text-muted-foreground mb-2 block">Sources</span>
          <div className="flex flex-wrap gap-2">
            {sources.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
              >
                <PixelPdfIcon className="size-3" />
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <span className="text-xs text-muted-foreground mb-2 block">Timeline</span>
          <div className="flex flex-col gap-2">
            {timeline.map((t) => (
              <div key={t.label} className="flex items-center gap-2">
                <span
                  className={`size-1.5 shrink-0 ${t.done ? 'bg-accent' : 'bg-muted-foreground/30'}`}
                />
                <span
                  className={`text-[11px] ${t.done ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
