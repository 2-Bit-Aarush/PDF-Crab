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
const mockViewModel = {
    title: "Periodic Trends & Molecular Bonds",
    sections: [
        {
            heading: "Electronegativity",
            body: `**Definition**:
> Electronegativity is defined as the tendency of an atom to attract shared electron pairs in a chemical bond.

**Key Explanation**:
Electronegativity increases across a period from left to right due to increased effective nuclear charge. Fluorine has the highest value of 4.0.

**Visual Snippet**:
![Formula](https://supabase.co/assets/docA-zeff-crop.png)
*Source: Periodic_Notes.pdf (Page 1)*

**Example**:
> F is more electronegative than Cl

**Important Points**:
- Increases across a period from left to right
- Decreases down a group as atomic size increases`,
            metadata: {
                id: "sec_electronegativity",
                title: "Electronegativity",
                prerequisites: ["Atomic Structure"],
                relatedTopics: ["Effective Nuclear Charge"],
                difficulty: "Medium",
                importanceScore: 9,
                studyIntelligence: {
                    coverage: { score: 100, documents: ["Periodic_Notes.pdf"] },
                    completeness: { percentage: 100 },
                    importance: 9,
                    confidence: 8,
                    missingPrerequisites: [],
                    conflicts: []
                }
            }
        }
    ]
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('--- TEST RUNNING ADAPTERS ---');
        // 1. Markdown Adapter
        const mdAdapter = new adapters_1.MarkdownAdapter();
        const mdOutput = yield mdAdapter.transform(mockViewModel);
        fs.writeFileSync('scratch/export_output.md', mdOutput, 'utf8');
        console.log('✓ Markdown output generated successfully in scratch/export_output.md');
        // 2. DOCX Adapter
        const docxAdapter = new adapters_1.DocxAdapter();
        const docxOutput = yield docxAdapter.transform(mockViewModel);
        fs.writeFileSync('scratch/export_output.doc', docxOutput, 'utf8');
        console.log('✓ DOCX HTML output generated successfully in scratch/export_output.doc');
        // 3. PDF Adapter
        try {
            const pdfAdapter = new adapters_1.PDFAdapter();
            const pdfBuffer = yield pdfAdapter.transform(mockViewModel);
            fs.writeFileSync('scratch/export_output.pdf', pdfBuffer);
            console.log('✓ PDF output generated successfully in scratch/export_output.pdf');
        }
        catch (err) {
            console.error('Failed to run PDF Adapter:', err);
        }
    });
}
main();
