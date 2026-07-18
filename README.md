# 🦀 PDF-Crab

> Transform scattered PDFs into one organized, study-ready notebook.

PDF-Crab is an AI-powered notebook compiler built for students. Instead of simply summarizing documents, it intelligently analyzes multiple PDFs, identifies overlapping concepts, preserves important scientific content, and generates a clean, structured notebook that's actually useful for revision.

---

## ✨ Features

- 📚 Compile multiple PDFs into a single notebook
- 🧠 AI-powered topic organization
- 🔍 OCR support for scanned documents
- 📐 Preserves equations, formulas, and scientific notation
- 🖼️ Preserves diagrams and important visual snippets
- 📝 Structured notes with definitions, explanations, key points, and examples
- 📖 Source Evidence for every topic
- 📄 Export notebooks as PDF
- 📱 Mobile-first interface
- ⚡ Fast notebook generation with live progress tracking

---

## 🚀 How It Works

```text
Upload PDFs
      │
      ▼
Extract Text & OCR
      │
      ▼
Layout Analysis
      │
      ▼
AI Topic Detection
      │
      ▼
Cross-Document Merge
      │
      ▼
Notebook Generation
      │
      ▼
Export to PDF
```

---

## 🛠 Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Next.js
- Supabase
- PostgreSQL

### AI & Processing

- OCR Pipeline
- Document Layout Analysis
- LLM-based Topic Compilation

### Export

- PDFKit

---

## 📂 Project Structure

```
app/
components/
hooks/
lib/
  export/
  ocr/
  compiler/
  utils/
types/
public/
```

---

## 🎯 Why PDF-Crab?

Traditional AI note summarizers often:

- Lose important details
- Rewrite formulas incorrectly
- Ignore diagrams
- Remove context
- Mix unrelated topics

PDF-Crab focuses on **compilation instead of summarization**, creating notebooks that remain faithful to the original study material while removing repetition and improving organization.

---

## 📸 Screenshots

> Add screenshots here

- Landing Page
- Vaults
- Notebook View
- Source Evidence
- PDF Export

---

## ⚙️ Getting Started

Clone the repository:

```bash
git clone https://github.com/2-Bit-Aarush/PDF-Crab.git
cd pdf-crab
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=
```

Run the development server:

```bash
npm run dev
```

---

## 🧩 Roadmap

- [x] Multi-PDF compilation
- [x] OCR support
- [x] PDF export
- [x] Source Evidence
- [x] Mobile-first redesign
- [ ] DOCX export
- [ ] Telegram Bot integration
- [ ] WhatsApp upload support
- [ ] Shared notebooks
- [ ] Collaborative study vaults

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.

Feel free to open an issue or submit a pull request.

---

## 📜 License

This project is licensed under the MIT License.

---

<div align="center">

### 🦀 Compile. Organize. Study.

Built with ❤️ for students who are tired of messy notes.

</div>
