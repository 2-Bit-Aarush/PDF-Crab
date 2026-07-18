# Pipeline Redesign Stages

- [x] **Stage 1: Structural Block Classification and Visual Cropping**
  - [x] Classify text vs visual blocks dynamically
  - [x] Crop equations, diagrams, tables, and handwritten annotations from source PDF
  - [x] Upload and store visual assets in Supabase Storage
  - [x] Serialize block array JSON in `ocr_jobs.processed_text`
  - [x] Retain raw markdown text in `ocr_jobs.raw_text` for search index
  - [x] Reconstruct text for backward compatibility in compile worker

- [x] **Stage 2: Knowledge Graph & Topic Intelligence Engine**
  - [x] Parse JSON block arrays in compile worker
  - [x] Extract structured Knowledge Graph (Topics, definitions, examples, asset links)
  - [x] Design Topic Intelligence Engine to resolve prerequisite order, pedagogical flow, and importance ranking

- [x] **Stage 3: Cross-Document Merge**
  - [x] Implement multi-document text merge rules
  - [x] Maintain verbatim union of all visual assets
  - [x] Aggregate source references and page numbers

- [x] **Stage 4: Quality Validation Pipeline**
  - [x] Implement checks for definitions, explanations, formulas, diagrams, examples, and page citations
  - [x] Add recursive search query back to source block arrays for missing fields

- [x] **Stage 5: Render Digital Notebook UI**
  - [x] Format compiled Master Note into enhanced student digital notebook layout

- [x] **Study Intelligence Engine**
  - [x] Generate study metadata (coverage, completeness, importance, confidence)
  - [x] Flag missing concepts and conflicting information
  - [x] Formulate revision, exam, visual, and quick review study modes

- [x] **Presentation & Metadata Separation**
  - [x] Remove JSON code block from user-facing markdown
  - [x] Relocate structured JSON payloads to `ocr_source` database column

- [x] **Quality Pass #0: Scientific Content Detector**
  - [x] Classify layout blocks into semantic content types (Natural Language, Scientific Notation, Mathematical Expression, Chemical Equation / Structure, Scientific Table, Scientific Diagram)
  - [x] Add semanticType and protectedContent properties to DocBlock
  - [x] Guard protectedContent blocks from AI paraphrasing or rewriting

- [x] **Quality Pass #1: Scientific Document Quality**
  - [x] Implement resilient fetchImageBuffer helper with retries and service credentials
  - [x] Force low confidence and scientific symbols blocks to visual crops
  - [x] Add Notebook Mode and Explanation Mode prompts
  - [x] Apply weighted completeness scoring
  - [x] Create comprehensive scientific document regression test suite

- [x] **Rigorous Golden Dataset Evaluation Framework**
  - [x] Create tests/golden-dataset directory and define representative golden cases
  - [x] Validate end-to-end output buffers (Markdown, PDF, DOCX) rather than intermediate structures
  - [x] Verify binary image rendering, non-blank status, dimensions, and corruption
  - [x] Track performance: timings (OCR, compile, merge, export), peak memory, tokens, and cost estimates
  - [x] Build historical trends (comparing with eval-history.json) and failure reports (failure-report.md)

- [x] **Unified Visual Asset Pipeline & Resolution**
  - [x] Implement compile-time resolveImageAssetUrl mapping relative block names (1.jpeg) to absolute storage URLs
  - [x] Implement shared AssetResolver class validating dimensions, headers, and buffers
  - [x] Decouple adapters to use AssetResolver and log unresolved references gracefully without crashing

- [x] **In-Place Master Note Updates**
  - [x] Refactor compile worker to update the existing Master Note in place instead of creating duplicate notes
  - [x] Preserve ID, Title, Created Date, Vault association, comments, and bookmarks
  - [x] Clean existing note sections first to prevent duplicate section records

- [x] **Master Note Compilation UX Polish**
  - [x] Render visual status badge reflecting Draft / Compiling / Compiled / Failed states
  - [x] Disable compiler action buttons and show inline spinners during active compilation
  - [x] Display error messages and a Retry trigger if compilation fails, keeping all draft content intact

- [x] **Live Compilation Progress Timeline**
  - [x] Expose internal compilation stages (Indexing, OCR & Reading, KG extraction, TIE sequencing, Composition & Quality checks)
  - [x] Render an interactive real-time visual progress timeline displaying completed, active, failed, and future steps
  - [x] Automatically pinpoint and display failed stages and debug logs in-place

- [x] **Visual Snippet Lifecycle Audit & Cache**
  - [x] Download storage assets and save to local workspace cache folder (`public/temp-crops/`) during compilation
  - [x] Pack detailed `VisualSnippet` metadata (signed URLs, storage keys, dimensions, local paths) inside sections JSON
  - [x] Validate HTML image sources in the React markdown renderer and display debug blocks on resolution failures

- [x] **Asset Inspector Page**
  - [x] Create `/inspector` debug page listing compiled visual snippets, load statuses, sizes, and dimensions

- [x] **Stage 6: Digital Notebook PDF/DOCX Export**
  - [x] Generate exports with embedded visual asset crops and complete styling
  - [x] Implement Markdown, DOCX, and PDF adapters
  - [x] Prepare interfaces for Flashcards, Quiz, Mind Map, and Anki adapters

## Final Polish & Product Refinements (Real-World Feedback)
- [x] **Task 1: Context-Aware Visual Snippets & Adaptive Padding**
  - [x] Implement context-aware adjacent block bounding box merging in OCR endpoint
  - [x] Implement adaptive margins/padding based on block classifications (equations, tables, graphs, diagrams)
  - [x] Force classification as visual type for all scientific notations, graphs, and tables
- [x] **Task 2: Source Evidence Card & Mobile Gallery**
  - [x] Update `vault-store.tsx` to retrieve and select the `ocr_source` JSON metadata column
  - [x] Add options parameter to `renderMarkdown` and implement `stripImages` to filter out image links in notebook view
  - [x] Implement the `SourceEvidenceCard` component in `generated-notes` view using pre-mapped visual asset lists
  - [x] Implement the fullscreen interactive gallery overlay with arrow swiping, zoom, and document name/page citations
  - [x] Programmatically sort visual snippets by educational importance (Definition -> Formula -> Diagram -> Table -> Worked Example -> Graph -> Other)
- [x] **Task 3: Minimizable Branded Loading Animation**
  - [x] Program phase-specific carried items (Document, magnifying glass, notebook, connection nodes, gold notebook)
  - [x] Implement real-time page stacking and binding visuals inside the destination folder
  - [x] Add subtle breathing, blinking, and wave personality frames to the walking crab
  - [x] Provide "Hide Animation" button and bottom floating progress indicators with "Restore" triggers
- [x] **Task 4: Compilation Summary Header Card**
  - [x] Program compile worker to log merged duplicate statistics and warnings in the database report
  - [x] Render a top-level summary header card in the notes page listing source files, timestamps, and compiled metrics
- [x] **Task 5: Topic Confidence Indicator**
  - [x] Create and display objective confidence level pills (High, Medium, Review) below headings based on document coverage and conflict markers
- [x] **Task 6: Progress Alignment & Pipeline Verification**
  - [x] Rename compile phases in compiler, compile API, page code, and Telegram webhook routes
  - [x] Display an intermediate 400ms "Upload Complete" state and a 2.0-second delay on compilation success for complete animation and metrics review

