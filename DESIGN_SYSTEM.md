# PDF-Crab Design System

This document outlines the core layout guidelines, visual vocabulary, and engineering constraints for **PDF-Crab**. All new pages, components, and interactions must adhere strictly to these principles to maintain the premium, Android-first visual identity.

---

## 1. Core Typography

PDF-Crab uses a dual-font structure to balance academic/historical authority with clean productivity:

*   **Primary Serif (`Playfair Display`):** Used **strictly and only** for brand marks and primary logos.
    *   *Examples:* App splash branding, PDF-Crab home header title, product landing branding.
*   **Primary Sans (`Geist`):** Used for **all** workspace titles, navigation elements, notes text, workspace headers, forms, inputs, settings labels, and metadata.
    *   *Font Variables:* Utilizes Next.js/Tailwind CSS variables mapped to `--font-geist-sans`.

---

## 2. Layout & Viewports (Android-First)

*   **Vertical Viewport Focus:** Layouts are optimized for vertically held mobile screens. Avoid placing critical items in absolute desktop rows or full-width grids.
*   **No Artificial Phone Frames:** Do not wrap layouts in desktop preview frames in production. The UI naturally fills the Android screen container.
*   **Thumb-Comfort Zone:** Frequently used buttons, toggles, list items, and input fields should occupy the lower two-thirds of the screen. Avoid top-heavy header triggers.

---

## 3. Spacing & Touch Targets

*   **Interactive Targets:** Any clickable element (buttons, input fields, toggles, list rows) must be at least **44px** (preferably **48px**) in height to allow comfortable touch access:
    *   *Inputs:* `h-11` or `h-12` (44px/48px).
    *   *Buttons:* `h-11` or `h-12` (44px/48px).
    *   *List Items:* Vertical row height should feel open and comfortable (`py-3.5` or `py-4`).
*   **Page Margins:** Consistent standard page margins of `px-4 py-8` or `px-5 py-10` globally.
*   **Item Spacers:** Utilize standard Tailwind gap systems (`gap-4`, `gap-5`, `gap-6`) to enforce hierarchy.

---

## 4. UI Elements & Accents

PDF-Crab balances minimalism with subtle retro productivity accents:

*   **No Heavy Cards or Borders:** Avoid heavy nested borders, cards within cards, and dramatic shadows. Use flat, borderless listings separated by subtle lines.
*   **Pixel Separators (`.pixel-divider`):** Horizontal dividers must use a 1px linear dotted gradient instead of solid `<hr />` tags.
*   **Dotted Vertical Timelines (`.pixel-divider-vertical`):** Timeline connectors use dotted vertical border alignments.
*   **Interactive Hover & Tap Feedback (`.touch-highlight-active`):** Applied to list actions and buttons to indicate micro-state shifts, prepping the viewport for native haptic feedback integration.

---

## 5. Animation & Transitions

To keep the application responsive and light, transitions are fast and fluid:

*   **Duration:** 180ms - 220ms.
*   **Easing:** Standard ease-out.
*   **Transforms:** Subtle vertical slide fade (`translate-y-1` to `translate-y-0`) instead of bouncy, large transforms.
*   **Class Mapping:** Apply `.animate-slide-fade` for entry transitions.

---

## 6. Accessiblity & Focus States

*   **Semantic Elements:** Use appropriate HTML tags (`<nav>`, `<header>`, `<article>`, `<section>`, `<button>`).
*   **Form Labels:** Every form input requires an explicit, readable placeholder or label block.
*   **Aria Roles:** Use `role="switch"` and `aria-checked` on interactive custom toggles.

---

## 7. Pixel Design Language

PDF-Crab integrates a retro-modern visual identity where pixel elements are functional components rather than superficial decorations. The pixel aesthetic represents the building of structured knowledge over time.

### Background Philosophy
*   **Landing Page:** Utilizes the animated `PixelBlast` WebGL background at normal opacity to create a dynamic, technical first impression.
*   **Login Page:** Uses a quiet, low-opacity (`opacity={0.06}`) version of the landing background to maintain professional calm.
*   **Active Workspace:** Do **NOT** use moving pixel particles. Workspaces employ the calm, dark `.bg-workspace-calm` backdrop containing deep charcoal tones, a subtle pixel grid, and dotted separators to support long hours of reading and research.

### Knowledge Visualization
Knowledge density is represented directly through segmented pixel blocks:
*   Empty state: `□`
*   Filled state: `■`
*   As documents are loaded and coverage increases, empty block nodes (`□`) transition to filled nodes (`■`), providing a visual representation of progress.

### Pixel Components
*   **Pixel Progress Bar (`PixelProgress`):** Replaces standard fluid progress bars with a fixed width, mono-spaced line of segments (e.g. `■■■■■■□□□□` for 60% coverage).
*   **Pixel Icons (`PixelFolderIcon`, `PixelDocIcon`, `PixelCrabIcon`):** Standardized retro-modern SVGs aligned to pixel coordinates, utilized exclusively in page headers, loading screen animations, and empty state illustrations.

### Loading Animations
Traditional spinners are replaced with step-by-step knowledge-building sequences:
1. `Reading Sources...  ■■□□□□□□`
2. `Extracting Text...   ■■■□□□□□`
3. `Detecting Topics...  ■■■■■□□□`
4. `Building Knowledge... ■■■■■■■■□`
5. `Master Note Complete ■■■■■■■■■■`
This simulated process sequence plays on master note compilation to reinforce the value of structural merging.
