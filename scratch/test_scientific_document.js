"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const adapters_1 = require("../lib/export/adapters");
// Stub global fetch to return a mock 1x1 PNG for testing Supabase assets without network calls
const originalFetch = globalThis.fetch;
globalThis.fetch = (url, init) => __awaiter(void 0, void 0, void 0, function* () {
    const urlStr = String(url);
    if (urlStr.includes('supabase.co/assets/')) {
        const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const buffer = Buffer.from(base64Png, 'base64');
        return new Response(buffer, {
            status: 200,
            headers: { 'Content-Type': 'image/png' }
        });
    }
    return originalFetch(url, init);
});
// Define the scientific test cases
const scientificModel = {
    title: "Scientific Document Integration Test Suite",
    sections: [
        {
            heading: "Chemistry: Periodic Trends & Structures",
            body: `**Definition**:
> Electronegativity is the tendency of an atom to attract shared electron pairs.

**Key Explanation**:
Periodic trends follow: F > O > N > Cl. Reaction mechanisms involve the transition states of organic molecules.

**Visual Snippet**:
![Organic Structure](https://supabase.co/assets/docA-benzene-crop.png)
*Source: Chemistry_Notes.pdf (Page 1)*

**Example**:
> Reaction: C2H5OH + HCl -> C2H5Cl + H2O`,
            metadata: {
                id: "chem_1",
                title: "Chemistry: Periodic Trends & Structures",
                prerequisites: ["Atomic Orbitals"],
                difficulty: "Hard",
                importanceScore: 9,
                studyIntelligence: {
                    coverage: { score: 100, documents: ["Chemistry_Notes.pdf"] },
                    completeness: { percentage: 100 },
                    importance: 9,
                    confidence: 8,
                    missingPrerequisites: [],
                    conflicts: []
                }
            }
        },
        {
            heading: "Physics: Derivations & Circuits",
            body: `**Definition**:
> Ohm's Law states that current is directly proportional to voltage.

**Key Explanation**:
The circuit diagram below shows resistors in series where R_total = R1 + R2 + R3.

**Visual Snippet**:
![Circuit Diagram](https://supabase.co/assets/docB-circuit-crop.png)
*Source: Physics_Notes.pdf (Page 2)*

**Example**:
> V = I * R`,
            metadata: {
                id: "phys_1",
                title: "Physics: Derivations & Circuits",
                prerequisites: ["Electric Current"],
                difficulty: "Medium",
                importanceScore: 8,
                studyIntelligence: {
                    coverage: { score: 100, documents: ["Physics_Notes.pdf"] },
                    completeness: { percentage: 100 },
                    importance: 8,
                    confidence: 9,
                    missingPrerequisites: [],
                    conflicts: []
                }
            }
        },
        {
            heading: "Mathematics: Calculus & Matrices",
            body: `**Definition**:
> A limit is the value that a function approaches as the input approaches some value.

**Key Explanation**:
The integration by parts formula: Integral of u dv = u*v - Integral of v du.

**Visual Snippet**:
![Calculus Formula](https://supabase.co/assets/docC-calculus-crop.png)
*Source: Math_Notes.pdf (Page 5)*

**Example**:
> Matrix A = [[1, 2], [3, 4]]`,
            metadata: {
                id: "math_1",
                title: "Mathematics: Calculus & Matrices",
                prerequisites: ["Functions"],
                difficulty: "Hard",
                importanceScore: 10,
                studyIntelligence: {
                    coverage: { score: 100, documents: ["Math_Notes.pdf"] },
                    completeness: { percentage: 100 },
                    importance: 10,
                    confidence: 9,
                    missingPrerequisites: [],
                    conflicts: []
                }
            }
        },
        {
            heading: "Biology: Organelle Structures",
            body: `**Definition**:
> Mitochondria are double-membraned organelles responsible for ATP synthesis.

**Key Explanation**:
The labelled diagram shows outer membrane, inner membrane, cristae, and matrix.

**Visual Snippet**:
![Labelled Diagram](https://supabase.co/assets/docD-mitochondria-crop.png)
*Source: Biology_Notes.pdf (Page 8)*

**Example**:
> Cell Respiration cycle`,
            metadata: {
                id: "bio_1",
                title: "Biology: Organelle Structures",
                prerequisites: ["Cell Biology"],
                difficulty: "Easy",
                importanceScore: 7,
                studyIntelligence: {
                    coverage: { score: 100, documents: ["Biology_Notes.pdf"] },
                    completeness: { percentage: 100 },
                    importance: 7,
                    confidence: 8,
                    missingPrerequisites: [],
                    conflicts: []
                }
            }
        }
    ]
};
function runTests() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('=== STARTING SCIENTIFIC DOCUMENT REGRESSION TESTS ===');
        // Test 1: Markdown Adapter Output
        console.log('\n[TEST 1] Running Markdown Adapter...');
        const mdAdapter = new adapters_1.MarkdownAdapter();
        const mdText = yield mdAdapter.transform(scientificModel);
        fs.writeFileSync('scratch/scientific_regression.md', mdText, 'utf8');
        console.log('✓ Markdown output saved to scratch/scientific_regression.md');
        // Test 2: DOCX Adapter Output
        console.log('\n[TEST 2] Running DOCX Adapter...');
        const docxAdapter = new adapters_1.DocxAdapter();
        const docxHtml = yield docxAdapter.transform(scientificModel);
        fs.writeFileSync('scratch/scientific_regression.doc', docxHtml, 'utf8');
        console.log('✓ DOCX HTML output saved to scratch/scientific_regression.doc');
        // Test 3: PDF Adapter Output
        console.log('\n[TEST 3] Running PDF Adapter (incorporating retries)...');
        try {
            const pdfAdapter = new adapters_1.PDFAdapter();
            const pdfBuffer = yield pdfAdapter.transform(scientificModel);
            fs.writeFileSync('scratch/scientific_regression.pdf', pdfBuffer);
            console.log('✓ PDF output saved to scratch/scientific_regression.pdf');
        }
        catch (err) {
            console.error('Failed to build PDF in test:', err);
        }
        console.log('\n=== ALL SCIENTIFIC REGRESSION TESTS COMPLETED ===');
    });
}
runTests();
