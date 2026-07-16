# PDF-Crab 🦀

An academic **Knowledge Compiler** that merges multiple study source documents (PDFs, images) into a single, comprehensive, authoritative **Master Note** while preserving technical integrity, formulas, and examples.

---

## The Vision: Knowledge Compiler vs. AI Summarizer

PDF-Crab is **not** an AI summarizer designed to compress and shorten your study notes by omitting details. It is a **Knowledge Compiler**. 

Its objective is to build a single definitive master document representing the union of all source knowledge while obeying the **Zero Information Loss Constitution**:
*   **Zero Information Loss**: Academic content is never removed simply to make the output shorter.
*   **Merge Complementary Knowledge**: Concepts explained from different perspectives across multiple files are synthesized into a single richer explanation.
*   **Remove Only True Duplicates**: Content is only removed when it is semantically identical.
*   **Preserve Technical Accuracy**: Verbatim preservation of formulas, equations, derivations, calculations, proofs, worked examples, and specialized technical terminology.
*   **Source Traceability**: Retain clear annotations referencing source files and metadata.

---

## Architecture & Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4, Vanilla CSS variables
- **Components**: shadcn/base-ui (`@base-ui/react`) for accessible interface primitives
- **Animations**: GSAP, Motion, and Three.js WebGL pixel-shading effects for landing UI

### Backend & Integrations
- **Database & Auth**: Supabase Auth (with Google OAuth) & PostgreSQL database
- **Storage**: Supabase Storage for secure PDF uploads
- **OCR Engine**: Mistral OCR (`mistral-ocr-latest`) layout-aware document parser
- **AI Compiler**: Groq AI client utilizing `llama-3.3-70b-versatile` for knowledge alignment and structural compilation

---

## Core Flow
```
PDF/Image Source ➔ Upload (Supabase Storage) ➔ OCR (Mistral OCR) ➔ Raw Markdown ➔ Knowledge Alignment ➔ Groq Compiler ➔ Master Note
```

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- `pnpm` package manager

### Environment Variables
Create a `.env.local` file in the root directory:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# AI API Keys
GROQ_API_KEY=YOUR_GROQ_API_KEY
OCR_Mistral_Key=YOUR_MISTRAL_OCR_API_KEY
```

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```
4. Build for production:
   ```bash
   pnpm build
   ```

---

## Diagnostics & Telemetry
PDF-Crab contains a built-in diagnostics suite accessible in development at `/dev/health`. This dashboard runs E2E validation tests against the backend integrations:
- Supabase Database connectivity
- Supabase Storage bucket listing
- Groq AI response latency
- Mistral OCR credentials, upload, processing, and temporary storage cleanup validation
