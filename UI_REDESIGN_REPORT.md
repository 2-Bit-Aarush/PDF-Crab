# PDF-Crab UI Redesign Report

**Session:** July 15, 2026  
**Scope:** UI-only pass — no backend, routing, auth, or feature changes  
**Goal:** Give PDF-Crab a memorable identity — a beautiful knowledge tool, not a startup template.

---

## Design Audit (Before)

| Screen | Weakness |
|--------|----------|
| **Global** | Generic dark SaaS palette; inconsistent border radii (lg vs none); mixed font-serif for brand |
| **Workspace background** | Visible but weak; grid too prominent; card-heavy layouts |
| **Buttons** | Inconsistent sizes; mono uppercase on some, rounded-lg on others; active bounce |
| **Vaults / Vault** | Dashed-border empty cards; nested card feel; generic "Search vaults..." |
| **Master Note** | Sparkles + "Generate" felt AI SaaS; cargo-build compile overlay; Lucide icons in lists |
| **Crab** | Bordered speech-bubble container; no 🦀 prefix; felt like assistant UI |
| **Landing** | Desktop dashboard mockup; heavy feature cards; "Smart OCR" copy |
| **Bottom nav** | Glassmorphism blur; generic labels |
| **Profile / Settings** | Bordered stat cards; "Saving" / generic SaaS toggles |
| **Motion** | Mixed durations (600ms splash, 700ms reveal, bounce/pulse on compile) |

---

## Design Decisions

### Identity direction

PDF-Crab is an **archive-first knowledge workspace** — not a chatbot, not a dashboard. Visual language borrows the **precision and structure** of late-90s productivity software while staying fully modern: flat surfaces, pixel accents as functional markers, notes as the hero.

Reference mood: Arc, Raycast, Obsidian, Linear — but with PDF-Crab's own pixel-archive vocabulary.

---

## Typography System

| Role | Font | Usage |
|------|------|-------|
| **Brand / metadata** | IBM Plex Mono (`font-brand`) | Logo, splash, build labels, archive counters, loading version strings |
| **Everything else** | Geist Sans (`font-sans`) | Titles, body, buttons, forms, notes, settings, crab dialogue |

**Rules enforced:**
- Removed `font-serif` from brand marks
- Page titles: Geist, `text-xl font-bold`
- Metadata rows: IBM Plex Mono at `10px` with tracking
- Crab dialogue: Geist `text-sm`, muted, no italics

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `--page-x` | `1.25rem` (20px) | Horizontal page padding |
| `--page-y` | `2rem` (32px) | Vertical page padding |
| `--touch-min` | `48px` | Minimum touch targets |
| `.page-shell` | max-width 28rem | All app screens |
| `.page-header` | border-top + 1rem pt | Section headers |
| `.list-row` | 48px min-height, 14px py | Open list items |
| Section gaps | `gap-6` / `gap-8` | Between major blocks |

**Cards reduced:** Removed dashed-border boxes, stat card borders, nested containers. Whitespace + pixel dividers replace borders.

---

## Color System

| Token | Value | Role |
|-------|-------|------|
| `--background` | `#0a0b0e` | App shell |
| Workspace | `#08090c` | `.bg-workspace-calm` — darker charcoal |
| `--foreground` | `#eceef2` | Primary text |
| `--muted-foreground` | `#8b919e` | Secondary text |
| `--accent` | `#2d8d9c` | Teal — actions, progress, active nav |
| `--border` | `rgba(255,255,255,0.06)` | Subtle separators |
| `--secondary` | `#181b22` | Inputs, secondary surfaces |

No gradients, glassmorphism, glow blobs, or scanlines in workspace.

---

## Motion System

| Property | Value |
|----------|-------|
| Duration | `180–200ms` |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Entry | Fade + `translateY(4px)` via `.animate-slide-fade` |
| Removed | Bounce, overshoot, scale transforms, pulse on compile |

Applied to: page entry, modals, kebab menus, touch highlights, splash fade.

---

## Background Implementation

### Workspace (`.bg-workspace-calm`)
- Base: `#08090c` — almost black charcoal
- Subtle pixel grid: 20px radial dots at 1.2% opacity
- Organic grain: SVG fractal noise overlay at 1.8% opacity
- Designed to **disappear** — content and notes command attention

### Landing (`PixelBackground`)
- Sharper pixels: `pixelSize={3}` (was 4)
- Calmer movement: `speed={0.1}` (was 0.2)
- Lower density: `patternDensity={0.75}`
- Stronger edge fade: `edgeFade={0.75}`

### Login
- PixelBlast at `opacity={0.05}` — nearly invisible, calm

---

## Icon Changes

Custom pixel SVGs at 16×16 grid (`components/pixel-icons.tsx`):

| Icon | Purpose |
|------|---------|
| `PixelFolderIcon` | Vaults |
| `PixelDocIcon` | Documents / empty notes |
| `PixelPdfIcon` | PDF sources |
| `PixelMasterNoteIcon` | Compiled master notes (new export) |
| `PixelArchiveIcon` | Archive / storage empty states |
| `PixelCrabIcon` | Mascot — blink, breathe, claw twitch |

**Replaced Lucide** in list rows with pixel icons on: vaults, vault detail, search, master note sources, bottom nav create menu.

Lucide retained for: navigation (bottom nav), arrows, upload, download, search field.

---

## Mascot Implementation

### Visual (`PixelCrabIcon`)
- No mouth
- Large pixel eyes with white highlights
- Rounded shell silhouette, tiny legs, oversized claws
- Readable at 16×16
- Frame animation: blink (6s), breathe (3s, 1px), claw twitch (5s, 1px)

### Dialogue (`CrabCaretaker`)
- Format: `🦀` + small animated crab icon + plain text
- No labels (Caretaker, Guide, Assistant removed)
- No speech bubble, border, or card container
- Geist `text-sm`, muted
- Global interaction counter — rare thoughtful dialogue every ~13 interactions

---

## Button Redesign

`components/ui/button.tsx`:
- Primary: accent fill, `rounded-[3px]`, `h-12`, semibold Geist
- Secondary: border + secondary bg, ghost for cancel
- Destructive: solid red, no opacity trick
- Removed active translate-y bounce

---

## Components Redesigned

| Component | Changes |
|-----------|---------|
| `globals.css` | Full token refresh, utility classes, motion |
| `button.tsx` | 48dp targets, 3px radius, unified motion |
| `modal.tsx` | 3px radius, bottom-sheet on mobile, no heavy shadow |
| `kebab-menu.tsx` | 48dp menu items, sharp corners |
| `crab-caretaker.tsx` | Minimal 🦀 dialogue, rare line system |
| `pixel-icons.tsx` | Crab redesign, PixelMasterNoteIcon |
| `pixel-background.tsx` | Sharper, calmer PixelBlast |
| `empty-archive.tsx` | **New** — archive empty states without dashed cards |
| `vault-manager.tsx` | Open lists, pixel icons, microcopy |
| `bottom-nav.tsx` | No blur, pixel create menu |
| `splash-screen.tsx` | IBM Plex Mono brand, build label |
| `hero.tsx` | Mobile-first copy, no desktop CTA styling |
| `hero-mockup.tsx` | Single-column mobile preview |
| `features.tsx` | Open layout, pixel icons, no cards |
| `workflow.tsx` | Vertical timeline, pixel step icons |
| `site-footer.tsx` | Archive tagline, build label |

### Pages

| Page | Key changes |
|------|-------------|
| `/login` | Open layout, "Enter the archive", field-input |
| `/dashboard` | VaultManager refresh |
| `/vault/[id]` | Open lists, EmptyArchive, filter copy |
| `/master/[id]` | Compile Master Note, pixel compile overlay, tab underline nav |
| `/search` | "Searching archive", pixel result icons |
| `/profile` | Borderless stats, "Archive updated" |
| `/settings` | Archive language, square toggles |

---

## Rewritten Text (Microcopy)

| Before | After |
|--------|-------|
| Generate | Compile Master Note |
| Saving / Saved | Archive updated |
| Search everything... | Searching archive... / Filter vaults... |
| Sign in | Enter the archive / Continue |
| Get Started | Open the archive |
| Smart OCR | Source intake |
| Knowledge Mapping | Topic alignment |
| Master Note Generation | Master note compile |
| No vaults found. Create one to begin. | No vaults yet — Create a vault for each subject you study. |
| Draft note workspace | Draft workspace — add sources, then compile |
| Compiler Telemetry Logs | Indexing sources (phase list) |
| Configure your workspace parameters | How your archive behaves |
| Log out | Sign out |
| Delete Vault | Remove Vault |

---

## Compile Overlay (Master Note)

**Removed:** Cargo build terminal, bounce animation, pulse, tech jargon  
**Added:** Phase list matching design system:

1. Reading sources  
2. Extracting text  
3. Detecting topics  
4. Building knowledge  
5. Master note complete  

Each phase reveals a `PixelProgress` bar. Crab sits quietly above with "Indexing sources" label.

---

## Remaining Weaknesses

1. **PillNav landing header** — still third-party GSAP component; not restyled this pass
2. **Hero mockup** — simplified to mobile column but still a static preview, not live app
3. **Profile data** — still mock ("Alex Morgan"); acceptable until backend
4. **Generate compile** — does not populate note sections (backend stub)
5. **Favicon assets** — still missing from `/public`
6. **DESIGN_SYSTEM.md** — references Playfair Display; should be updated to match IBM Plex Mono decision
7. **Rare crab dialogues** — counter resets on page navigation (session-only, not persisted)

---

## Future UI Ideas

- **Reader mode:** Full-bleed note typography with adjustable line length for long study sessions
- **Vault color tags:** Subtle left-edge accent per vault (one hex, user-picked)
- **Haptic feedback:** Wire `touch-highlight-active` to Android vibration API
- **Splash in app boot:** Optional archive index animation on `/dashboard` first load
- **Pixel loading skeleton:** Replace blank states during future API calls
- **Source page preview:** Thumbnail strip using PixelPdfIcon + page number
- **Compile sound:** Optional subtle mechanical click (off by default) on compile complete
- **Dark-only refinement:** Slightly warm paper tone (`#f4f0e8`) for Generated Notes tab in a future light reading mode

---

## Recognition Test

> *If I saw one screenshot on Twitter, would I instantly recognize it as PDF-Crab?*

**After this pass:** The combination of **charcoal archive background + pixel folder/PDF icons + segmented ■□□ progress + 🦀 muted dialogue + Compile Master Note** creates a distinct fingerprint. The landing PixelBlast + IBM Plex Mono splash reinforces brand entry.

**Not yet unique enough:** PillNav header and login flow still share DNA with React Bits templates. Next pass should custom-build a minimal landing nav and add one signature color moment (e.g. accent teal only on compile button + active tab underline — already started).

---

## Files Modified

```
app/globals.css
app/layout.tsx
app/login/page.tsx
app/(app)/vault/[id]/page.tsx
app/(app)/master/[id]/page.tsx
app/(app)/search/page.tsx
app/(app)/profile/page.tsx
app/(app)/settings/page.tsx
components/ui/button.tsx
components/ui/modal.tsx
components/ui/kebab-menu.tsx
components/crab-caretaker.tsx
components/pixel-icons.tsx
components/pixel-background.tsx
components/empty-archive.tsx
components/vault-manager.tsx
components/bottom-nav.tsx
components/splash-screen.tsx
components/hero.tsx
components/hero-mockup.tsx
components/features.tsx
components/workflow.tsx
components/site-footer.tsx
```

**Created:** `UI_REDESIGN_REPORT.md`, `components/empty-archive.tsx`

---

*PDF-Crab should feel like opening a well-organized archive — quiet, precise, and built for people who live inside their notes.*
