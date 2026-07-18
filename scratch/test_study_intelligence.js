const { Groq } = require('groq-sdk');
const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const groqKeyLine = envContent.split('\n').find(line => line.startsWith('GROQ_API_KEY='));
  const apiKey = groqKeyLine ? groqKeyLine.split('=')[1].trim() : '';
  const groq = new Groq({ apiKey });

  const mockLocalKGs = [
    {
      documentName: 'Periodic_Notes.pdf',
      topics: [
        {
          name: "Electronegativity",
          definition: "Electronegativity is defined as the tendency of an atom to attract shared electron pairs in a chemical bond.",
          explanation: "Electronegativity increases across a period from left to right due to increased effective nuclear charge. Fluorine is highly electronegative.",
          importantPoints: ["Increases across a period", "Fluorine has the highest value of 4.0"],
          examples: ["F is more electronegative than Cl"],
          visualAssets: [
            {
              subType: "Formula",
              imageUrl: "https://supabase.co/assets/docA-zeff-crop.png"
            }
          ],
          pages: [1]
        }
      ],
      relationships: []
    },
    {
      documentName: 'NCERT_Chapter_3.pdf',
      topics: [
        {
          name: "Electro-negativity",
          definition: "Electro-negativity refers to the relative power of an atom to attract shared electrons.",
          explanation: "As we move down a group, the atomic radius increases and electronegativity decreases.",
          importantPoints: ["Decreases down a group"],
          examples: ["Oxygen is more electronegative than Sulfur"],
          visualAssets: [
            {
              subType: "Diagram",
              imageUrl: "https://supabase.co/assets/docB-trend-crop.png"
            }
          ],
          pages: [4]
        }
      ],
      relationships: []
    }
  ];

  console.log('--- TEST STUDY INTELLIGENCE ENGINE ---');
  const mergePrompt = `You are the Cross-Document Merge Engine and Study Intelligence Engine for PDF-Crab.
Merge the local Knowledge Graphs, resolve duplicates semantically, and enrich them with Study Intelligence metadata.

Local Knowledge Graphs:
${JSON.stringify(mockLocalKGs)}

You must return a JSON object strictly matching this schema:
{
  "topics": [
    {
      "id": "t1",
      "title": "Topic Name",
      "definition": "verbatim definition",
      "explanation": "merged explanation",
      "importantPoints": [
        {
          "text": "Point 1",
          "source": "Document.pdf (Page X)"
        }
      ],
      "examples": [
        {
          "text": "Example 1",
          "source": "Document.pdf (Page X)"
        }
      ],
      "visualAssets": [
        {
          "subType": "Formula | Diagram | ...",
          "imageUrl": "...",
          "source": "Document.pdf (Page X)"
        }
      ],
      "pageReferences": [1, 4],
      "prerequisites": ["Atomic Structure"],
      "relatedTopics": [],
      "difficulty": "Medium",
      "importanceScore": 8,
      "studyIntelligence": {
        "coverage": {
          "score": 100,
          "documents": ["Periodic_Notes.pdf", "NCERT_Chapter_3.pdf"]
        },
        "completeness": {
          "percentage": 100,
          "hasDefinition": true,
          "hasExplanation": true,
          "hasExamples": true,
          "hasFormula": true,
          "hasDiagram": true,
          "hasImportantPoints": true,
          "hasSourceReferences": true
        },
        "importance": 9,
        "confidence": 9,
        "missingPrerequisites": ["Atomic Orbitals"],
        "conflicts": ["Terminology conflict between tendency and power to attract."],
        "studyModes": {
          "revision": "Markdown for revision",
          "exam": "Markdown for exam",
          "visual": "Markdown for visual assets",
          "quickReview": "Markdown for quick review"
        }
      }
    }
  ]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are the Study Intelligence Engine. Merge and enrich topics, returning structured JSON.' },
        { role: 'user', content: mergePrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);
    console.log('Study Intelligence Engine Output:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error in study intelligence engine run:', err);
  }
}

main();
