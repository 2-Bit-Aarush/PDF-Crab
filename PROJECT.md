# PDF-Crab — Project Documentation

> **Audience:** Senior engineers joining the project.  
> **Last reviewed:** July 14, 2026  
> **Status:** Frontend prototype with in-memory mock data. No backend, database, or real authentication.

---

## Vision

PDF-Crab is a productivity application for students that merges multiple PDFs and handwritten notes into a single **Master Note**. Unlike AI summarizers, it preserves original wording, diagrams, formulas, and formatting while intelligently removing duplicate information and merging unique concepts.

The product should feel like premium productivity software — inspired by **Apple**, **Linear**, **Arc Browser**, **Raycast**, and **Obsidian** — and must **never** feel like generic AI SaaS or a chatbot.

### Core Domain Concepts

| Concept | Description |
|---------|-------------|
| **Vault** | Represents a subject (e.g. ECE, Operating Systems, Mathematics). Contains multiple Master Notes. |
| **Master Note** | Not a PDF. A tabbed workspace for merging uploaded PDFs/images — includes generated notes, sources, formula sheet, definitions, knowledge timeline, coverage, and export. |
| **Dashboard** | The Vault Manager. Entry point for browsing and managing all vaults. |

### Planned User Flow

```
Splash → Landing → Login → Dashboard (Vault Manager) → Vault → Master Note (workspace)
```

**Current implementation:** Splash and Landing exist. Login bypasses auth. App routes skip Splash. The Master Note is a single-page workspace with tabs — there is no separate Reader or Upload route.

---

## Architecture

### Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/base-ui (`@base-ui/react`) |
| Animation | GSAP, Motion, Three.js + postprocessing (landing effects) |
| Icons | Lucide React |
| Fonts | Geist Sans / Geist Mono (Google Fonts) |
| Analytics | Vercel Analytics (production only) |
| Package manager | pnpm |

### High-Level Architecture (Current)

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│  Public routes          │  App routes (route group)         │
│  /  (Landing)           │  /dashboard                       │
│  /login                 │  /vault/[id]                      │
│                         │  /master/[id]  (tabbed workspace) │
│                         │  /search, /profile, /settings     │
├─────────────────────────────────────────────────────────────┤
│              VaultStoreProvider (React Context)              │
│              In-memory state, seeded mock data               │
├─────────────────────────────────────────────────────────────┤
│                    No API / No Database                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Client-side state only** — All vault/master note data lives in `lib/vault-store.tsx` via React Context. Data resets on page refresh.
2. **Route group `(app)`** — Shared layout with sidebar and `VaultStoreProvider` wraps all authenticated-style pages.
3. **No middleware / no auth guards** — Any user can navigate directly to `/dashboard` without logging in.
4. **Marketing vs. app split** — Landing page uses animated components (PixelBlast, PillNav, DecryptedText); app uses a minimal sidebar shell.
5. **Master Note as workspace** — Reading, sources, export, and upload all live inside `/master/[id]` via tabs and dialogs. No standalone Reader or Upload routes.

### Planned Backend Architecture (Not Implemented)

```
Client (Next.js)
    │
    ├── Auth service (Google OAuth, email/password)
    ├── File upload service (S3 / blob storage)
    ├── Processing pipeline
    │     ├── OCR
    │     ├── Handwriting recognition
    │     ├── Topic segregation
    │     ├── Duplicate removal
    │     ├── Diagram preservation
    │     ├── Formula extraction
    │     └── Definition extraction
    └── Export service (PDF, DOCX, Markdown)
```

Integrations planned: **Telegram Bot**, **WhatsApp Bot** (future).

---

## Folder Structure

```
PDF-Crab/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, metadata, analytics)
│   ├── page.tsx                  # Landing page (/)
│   ├── globals.css               # Tailwind v4 + design tokens
│   ├── login/
│   │   └── page.tsx              # Login screen (no sidebar)
│   └── (app)/                    # Route group — app shell
│       ├── layout.tsx            # Sidebar + VaultStoreProvider
│       ├── dashboard/page.tsx    # Vault manager
│       ├── vault/[id]/page.tsx   # Vault detail
│       ├── master/[id]/page.tsx  # Master note tabbed workspace
│       ├── search/page.tsx       # Global search
│       ├── profile/page.tsx      # User profile
│       └── settings/page.tsx     # App settings
│
├── components/
│   ├── ui/                       # shadcn-style primitives
│   │   ├── button.tsx
│   │   ├── modal.tsx
│   │   └── kebab-menu.tsx
│   ├── app-shell.tsx             # Splash wrapper (landing only)
│   ├── app-sidebar.tsx           # App navigation sidebar
│   ├── vault-manager.tsx         # Dashboard vault grid
│   ├── splash-screen.tsx         # Animated splash
│   ├── site-header.tsx           # Landing nav (PillNav)
│   ├── site-footer.tsx           # Landing footer
│   ├── hero.tsx                  # Landing hero
│   ├── hero-mockup.tsx           # Static product mockup
│   ├── features.tsx              # Feature cards
│   ├── workflow.tsx              # How-it-works steps
│   ├── reveal.tsx                # Scroll reveal animation
│   ├── pixel-background.tsx      # Three.js background wrapper
│   ├── PixelBlast.jsx            # React Bits — WebGL pixel effect
│   ├── PillNav.jsx               # React Bits — animated pill nav
│   ├── DecryptedText.jsx         # React Bits — text decrypt animation
│   ├── dotted-surface.tsx        # ⚠ UNUSED placeholder
│   └── expandable-tabs.tsx       # ⚠ UNUSED placeholder
│
├── lib/
│   ├── vault-store.tsx           # Domain state (Context + hooks)
│   └── utils.ts                  # cn() helper
│
├── public/
│   └── logo.svg                  # Only asset present
│
├── components.json               # shadcn config
├── next.config.mjs               # Next.js config
├── package.json
├── tsconfig.json
└── postcss.config.mjs
```

### Notable Absences

- No `hooks/` directory (alias exists in `components.json` but unused)
- No `types/` or shared schema definitions
- No `api/` routes
- No `middleware.ts` for auth
- No tests
- No README
- No ESLint config (script exists in `package.json`)

---

## Routes

| Route | Layout | Purpose | Status |
|-------|--------|---------|--------|
| `/` | Root | Landing page with splash, hero, features, workflow | Complete (marketing) |
| `/login` | Root | Email/password sign-in | UI complete; auth is fake |
| `/dashboard` | `(app)` | Vault manager (primary app entry) | Functional (mock data) |
| `/vault/[id]` | `(app)` | List master notes in a vault; CRUD vault | Functional |
| `/master/[id]` | `(app)` | Tabbed master note workspace | Functional (tabs + upload dialog) |
| `/search` | `(app)` | Search vaults and master notes by title | Functional (client-side) |
| `/profile` | `(app)` | User profile and stats | Mock user data |
| `/settings` | `(app)` | Toggles and export format preference | UI only — not persisted |

### Removed Routes

| Route | Reason |
|-------|--------|
| `/vaults` | Duplicate of `/dashboard` — removed |
| `/upload` | Upload moved into Master Note "Add Sources" dialog |
| `/reader/[id]` | Reading moved into Master Note "Generated Notes" tab |

### Navigation Map

```
/ (Landing)
 └── /login
      └── /dashboard ──┬── /vault/[id] ── /master/[id]
                       ├── /search
                       ├── /profile
                       └── /settings
```

### Sidebar Navigation

| Link | Route |
|------|-------|
| Vaults | `/dashboard` |
| Search | `/search` |
| Profile | `/profile` |
| Settings | `/settings` |
| Log out | `/login` |

---

## Master Note Workspace

The Master Note at `/master/[id]` is a single-page workspace with seven tabs:

| Tab | Purpose |
|-----|---------|
| **Overview** | Coverage, sources summary, timeline summary |
| **Generated Notes** | Read merged note content (formerly the Reader route) |
| **Sources** | Full source list; "Add Sources" opens upload dialog |
| **Formula Sheet** | Extracted formulas (empty until backend) |
| **Definitions** | Extracted definitions (empty until backend) |
| **Knowledge Timeline** | Full topic timeline |
| **Export** | Markdown export |

### Add Sources Flow

```
Master Note → Add Sources (header or Sources tab)
           → Upload Dialog (drag-and-drop or browse)
           → Sources attached to current note
           → Dialog closes; Sources tab shown
```

Upload is scoped to the current master note — no vault/note selection required.

---

## Components

### UI Primitives (`components/ui/`)

| Component | Used In |
|-----------|---------|
| `Button` | Login, vault-manager, vault detail, master note, settings, profile |
| `Modal` | vault-manager, vault detail, master note (upload dialog) |
| `KebabMenu` | vault-manager, vault detail |

### App Components

| Component | Purpose | Used In |
|-----------|---------|---------|
| `AppSidebar` | Fixed left nav with logo, links, logout | `(app)/layout.tsx` |
| `VaultManager` | Vault grid, search, create/rename/delete | `/dashboard` |

### Landing / Marketing Components

| Component | Purpose | Used In |
|-----------|---------|---------|
| `AppShell` | Shows splash then fades in content | `/` |
| `SplashScreen` | Logo + DecryptedText animation | `AppShell` |
| `PixelBackground` | WebGL pixel shader background | `/` |
| `SiteHeader` | PillNav with hash links + Get Started → `/login` | `/` |
| `SiteFooter` | Logo, footer links, copyright | `/` |
| `Hero` | Headline, CTA, mockup | `/` |
| `HeroMockup` | Static UI preview of product | `Hero` |
| `Features` | Four feature cards | `/` |
| `Workflow` | Five-step pipeline visualization | `/` |
| `Reveal` | Intersection-observer scroll animation | Hero, Features, Workflow |

### Third-Party / React Bits Components (`.jsx`)

| Component | Purpose | Notes |
|-----------|---------|-------|
| `PixelBlast` | Three.js animated pixel background | Heavy dependency (~600 lines) |
| `PillNav` | GSAP animated pill navigation | Imports `react-router-dom` (incompatible with Next.js routing if non-hash links used) |
| `DecryptedText` | Character scramble reveal animation | Used in splash |

### Unused / Placeholder Components

| Component | Status |
|-----------|--------|
| `DottedSurface` | Placeholder — empty div, never imported |
| `ExpandableTabs` | Placeholder nav — never imported; superseded by `PillNav` |

---

## UI Flow

### Landing Flow

1. User visits `/`
2. `AppShell` shows `SplashScreen` (2s decrypt animation)
3. Landing content fades in: header → hero → features → workflow → footer
4. "Get Started" or login CTA → `/login`

### Authenticated Flow (Unprotected)

1. `/login` — any credentials → `/dashboard`
2. `/dashboard` — browse/create/rename/delete vaults
3. `/vault/[id]` — browse/create master notes; rename/delete vault
4. `/master/[id]` — tabbed workspace:
   - Overview for at-a-glance metrics
   - Generated Notes for reading content
   - Sources tab or header button → Add Sources upload dialog
   - Formula Sheet / Definitions (empty until generation backend exists)
   - Knowledge Timeline for topic progression
   - Export for Markdown download
5. `/search` — filter vaults/notes by title
6. `/profile` — edit mock profile, view stats
7. `/settings` — toggle preferences (not persisted), logout → `/login`

---

## Data Flow

### State Management

**Single source of truth:** `VaultStoreProvider` in `lib/vault-store.tsx`

```typescript
// Types
Vault { id, name, updatedAt, masterNotes[] }
MasterNote { id, vaultId, title, coverage, generated, sources[], timeline[], sections[] }
SourcePdf { id, name, pages }
TimelineEntry { id, label, date }
```

**Hook:** `useVaults()` — throws if used outside provider.

**Operations:**

| Method | Behavior |
|--------|----------|
| `createVault(name)` | Adds empty vault, returns id |
| `renameVault(id, name)` | Updates name + `updatedAt` |
| `deleteVault(id)` | Removes vault |
| `getVault(id)` | Lookup |
| `createMasterNote(vaultId, title)` | Creates draft note (coverage 0, empty arrays) |
| `renameMasterNote(id, title)` | Updates title — **not wired in UI** |
| `deleteMasterNote(id)` | Removes note — **not wired in UI** |
| `getMasterNote(id)` | Returns `{ note, vault }` |
| `generateMasterNote(id)` | Sets `generated: true`, bumps coverage — **does not populate sections** |
| `addSource(noteId, name)` | Appends source with **random page count** |

**Persistence:** None. Seed data reinitializes on every full page load.

### Upload Data Flow (Current — Stub)

```
User opens Add Sources dialog on /master/[id]
→ Selects files (drag-and-drop or browse)
→ Filenames passed to addSource() for current note
→ Dialog closes; Sources tab shown
```

No binary upload, no storage, no OCR trigger.

### Export Data Flow (Current — Partial)

```
User opens Export tab on /master/[id]
→ Clicks Export Markdown
→ sections joined as Markdown string
→ Blob download as .md file
```

PDF and DOCX export not implemented despite settings UI.

---

## Planned Database

Not implemented. Suggested schema for future backend:

```
users
  id, email, name, avatar_url, created_at

vaults
  id, user_id, name, updated_at

master_notes
  id, vault_id, title, coverage, generated, created_at, updated_at

sources
  id, master_note_id, file_url, file_type, page_count, ocr_status

ocr_results
  id, source_id, page_number, raw_text, layout_json

master_note_sections
  id, master_note_id, heading, body, order, source_refs[]

timeline_entries
  id, master_note_id, label, date, order

formulas
  id, master_note_id, latex, context, source_ref

definitions
  id, master_note_id, term, definition, source_ref

topic_map
  id, master_note_id, topic, parent_topic_id, coverage_pct
```

---

## Feature List vs. Implementation

| Feature | Planned | Status |
|---------|---------|--------|
| **Authentication** | | |
| Google Login | ✓ | ❌ Not implemented |
| Email Login | ✓ | ⚠ UI only — no validation/backend |
| **Vault System** | | |
| Create Vault | ✓ | ✅ |
| Rename Vault | ✓ | ✅ |
| Delete Vault | ✓ | ✅ |
| **Master Notes** | | |
| Create Master Note | ✓ | ✅ |
| Rename Master Note | ✓ | ⚠ Store method exists, no UI |
| Delete Master Note | ✓ | ⚠ Store method exists, no UI |
| **Upload** | | |
| PDF | ✓ | ⚠ Filename only (via Add Sources dialog) |
| Images | ✓ | ⚠ Filename only (via Add Sources dialog) |
| Telegram Bot | ✓ | ❌ |
| WhatsApp Bot | ✓ | ❌ |
| **AI Processing** | | |
| OCR | ✓ | ❌ |
| Handwriting Recognition | ✓ | ❌ |
| Topic Segregation | ✓ | ❌ |
| Duplicate Removal | ✓ | ❌ |
| Diagram Preservation | ✓ | ❌ |
| Formula Extraction | ✓ | ❌ (tab exists, empty) |
| Definition Extraction | ✓ | ❌ (tab exists, empty) |
| **Analysis** | | |
| Coverage | ✓ | ⚠ Static/mock values |
| Missing Topics | ✓ | ❌ |
| Confidence Indicator | ✓ | ❌ |
| Timeline | ✓ | ⚠ Seed data only |
| **Export** | | |
| PDF | ✓ | ❌ |
| DOCX | ✓ | ❌ |
| Markdown | ✓ | ✅ Basic client-side export |

---

## Current Status

### What Works

- Polished dark-theme landing page with animations
- App shell with responsive sidebar (Vaults, Search, Profile, Settings)
- Full vault CRUD (in-memory)
- Master note creation and tabbed workspace navigation
- Upload dialog scoped to current master note
- Generated Notes tab for reading content
- Client-side search across vaults/notes
- Markdown export from Export tab
- Consistent design language (cards, borders, accent teal `#2d8d9c`)

### What Is Stubbed / Fake

- Authentication (login accepts anything)
- File upload (stores filenames, not files)
- Generate Master Note (toggles flag, no content generation)
- Formula Sheet and Definitions tabs (empty placeholders)
- Settings toggles (local component state only)
- Profile (hardcoded "Alex Morgan")
- Source page counts (random)
- Coverage percentages (seed or formula-based, not real)

### What Is Missing From Domain Model

Per product spec, Master Notes should store: OCR Results, Topic Mapping, Formula Sheet, Definitions, References as structured data. Current `MasterNote` type only has `sections`, `sources`, and `timeline`. Formula Sheet and Definitions tabs exist in UI but have no backing data yet.

---

## Known Issues

### Bugs

1. **`react-router-dom` in Next.js app** — `PillNav.jsx` imports `Link` from `react-router-dom`. Currently mitigated because all nav items use hash/external hrefs (rendered as `<a>`), but adding a real route would break without a Router provider.
2. **Missing favicon/icon assets** — `app/layout.tsx` references `icon-light-32x32.png`, `icon-dark-32x32.png`, `icon.svg`, `apple-icon.png`; only `public/logo.svg` exists.
3. **Generate does not create content** — New master notes stay empty after "Generate"; Generated Notes tab shows empty state.
4. **No route protection** — App routes accessible without login.
5. **State loss on refresh** — All user-created vaults/notes lost.
6. **Broken footer/header hash links** — `#github`, `#privacy`, `#terms`, `#get-started` (except intercepted Get Started) have no corresponding page sections.

### Technical Debt

1. `next.config.mjs` sets `typescript.ignoreBuildErrors: true` — masks type errors at build time
2. `package.json` name is `"my-project"` not `"pdf-crab"`
3. Mixed JS/TS — React Bits components are `.jsx` without types
4. Unused dependency: `react-router-dom` (only used by PillNav, incorrectly for Next.js)
5. Unused components: `DottedSurface`, `ExpandableTabs`
6. Unused store methods: `renameMasterNote`, `deleteMasterNote`
7. No ESLint configuration despite `"lint": "eslint ."` script
8. No tests, no CI, no README
9. Heavy landing dependencies (Three.js, postprocessing, GSAP) increase bundle size
10. Duplicated modal/form patterns across vault-manager and vault detail pages
11. Metadata `generator: 'v0.app'` — indicates v0/React Bits origin
12. `hooks/` alias in `components.json` with no corresponding folder

### UI Inconsistencies

1. Splash only on landing — not in planned app workflow
2. Login page has no Google OAuth button (spec requires it)
3. Login page lacks sidebar; app pages always show sidebar (no unified auth layout)
4. Settings export formats (PDF, Plain text) don't match master note export (Markdown only)
5. "Sparkles" icon on Generate button — risks feeling "AI SaaS" vs. productivity tool aesthetic

---

## Future Roadmap

### Phase 1 — Foundation

- [x] Remove `/vaults` duplicate — dashboard is the only vault manager route
- [x] Move upload into Master Note Add Sources dialog
- [x] Remove Reader route — reading in Generated Notes tab
- [x] Master Note tabbed workspace (Overview, Generated Notes, Sources, Formula Sheet, Definitions, Knowledge Timeline, Export)
- [ ] Rename package, add README, ESLint, fix `ignoreBuildErrors`
- [ ] Add missing public assets (favicons)
- [ ] Replace `PillNav` react-router-dom with Next.js `Link` or plain anchors
- [ ] Delete unused placeholder components
- [ ] Wire `renameMasterNote` / `deleteMasterNote` in UI
- [ ] Add middleware for auth-protected routes

### Phase 2 — Backend & Persistence

- [ ] Auth (Google OAuth + email via NextAuth, Clerk, or custom)
- [ ] Database (PostgreSQL + Prisma/Drizzle suggested)
- [ ] File storage (S3/R2) for PDFs and images
- [ ] API routes for vault/note CRUD
- [ ] Persist settings and profile

### Phase 3 — Processing Pipeline

- [ ] Real file upload with progress
- [ ] OCR integration
- [ ] Handwriting recognition
- [ ] Topic mapping and duplicate removal
- [ ] Formula/definition extraction (populate Formula Sheet and Definitions tabs)
- [ ] Real coverage and confidence metrics

### Phase 4 — Export & Integrations

- [ ] PDF export
- [ ] DOCX export
- [ ] Telegram bot webhook
- [ ] WhatsApp bot (planned)

### Phase 5 — Polish

- [ ] Splash in app boot flow (if desired)
- [ ] Missing topics analysis UI
- [ ] Source reference linking in Generated Notes tab
- [ ] Performance: code-split Three.js landing effects
- [ ] Accessibility audit (modals, focus trap, keyboard nav)

---

## Development

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
pnpm start
pnpm lint     # ⚠ No eslint config present
```

### Environment

No `.env` files or environment variables are currently used.

### Design Tokens

Defined in `app/globals.css`:

- Background: `#0f1115`
- Card: `#171a21`
- Accent: `#2d8d9c` (teal)
- Border: `rgba(255,255,255,0.08)`
- Radius: `1rem` base

Dark mode only. Root layout forces `className="dark"`.

---

## Architecture Scores (Post-Simplification)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Folder structure | 7/10 | Cleaner routes; master note consolidated |
| Component quality | 6/10 | Good UI primitives; placeholders remain |
| Scalability | 4/10 | No backend layer; monolithic context store |
| Maintainability | 6/10 | Fewer routes; JS/TS mix and no tests remain |
| Code cleanliness | 6/10 | Dead routes removed; stubs and unused code remain |
| Consistency | 7/10 | Unified navigation and master note workspace |
| Routing | 7/10 | Simplified tree; no guards yet |
| UI | 7/10 | Polished dark productivity aesthetic |
| Developer experience | 5/10 | No README, lint config, or favicons |

**Overall:** Architecture simplified. Master Note is the central workspace. Backend, auth, and persistence still required before production.
