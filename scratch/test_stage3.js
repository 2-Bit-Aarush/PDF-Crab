const { Groq } = require('groq-sdk');
const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const groqKeyLine = envContent.split('\n').find(line => line.startsWith('GROQ_API_KEY='));
  const apiKey = groqKeyLine ? groqKeyLine.split('=')[1].trim() : '';
  const groq = new Groq({ apiKey });

  // Mock extracted Knowledge Graph for Doc A
  const docAKG = {
    topics: [
      {
        name: "Electronegativity",
        definition: "Electronegativity is defined as the tendency of an atom to attract shared electron pairs in a chemical bond.",
        explanation: "Electronegativity increases across a period from left to right due to increased effective nuclear charge. For instance, Fluorine is highly electronegative.",
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
  };

  // Mock extracted Knowledge Graph for Doc B (containing minor variations/duplicates and new visuals/explanations)
  const docBKG = {
    topics: [
      {
        name: "Electro-negativity",
        definition: "Electro-negativity refers to the relative power of an atom in a molecule to attract shared electrons to itself.",
        explanation: "As we move down a group, the atomic radius increases and electronegativity decreases because the valence shell is further from the nucleus.",
        importantPoints: ["Decreases down a group", "Cesium has one of the lowest values"],
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
  };

  const allLocalKGs = [
    { documentName: 'Periodic_Notes.pdf', topics: docAKG.topics, relationships: docAKG.relationships },
    { documentName: 'NCERT_Chapter_3.pdf', topics: docBKG.topics, relationships: docBKG.relationships }
  ];

  console.log('--- TEST STAGE 3: CROSS-DOCUMENT MERGE ---');
  const mergePrompt = `You are the Cross-Document Merge Engine for PDF-Crab.
We have extracted the local Knowledge Graphs from multiple source documents in this vault.
Merge them into one Unified Topic Graph representing the entire vault.

Local Knowledge Graphs:
${JSON.stringify(allLocalKGs)}

Instructions:
1. Merge topics with the same semantic meaning (e.g. "Electronegativity" and "Electro-negativity") into a single topic node.
2. For each merged topic:
   - Pick the best verbatim definition from the sources. Do not rewrite.
   - Merge explanations by combining unique insights and removing duplicate sentences.
   - Combine important points by taking their union, removing exact duplicates.
   - Keep ALL useful examples from all sources (do not discard any).
   - Keep ALL visual assets (imageUrl, subType, source) from all sources. Never discard or merge visuals.
   - Ensure complete source traceability: every merged sentence, bullet point, example, and image must retain a source citation mapping (document name, page number, block ID).
   - Merge graph relationships (prerequisites, relatedTopics, dependsOn, children).

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
          "subType": "...",
          "imageUrl": "...",
          "source": "Document.pdf (Page X)"
        }
      ],
      "pageReferences": [1, 4],
      "prerequisites": [],
      "relatedTopics": [],
      "dependsOn": [],
      "children": [],
      "difficulty": "Medium",
      "importanceScore": 8
    }
  ]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are the Cross-Document Merge Engine. Merge multiple topic graphs into a unified one and output JSON.' },
        { role: 'user', content: mergePrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(content);
    console.log('Unified Topic Graph JSON output:');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error in Stage 3 test:', err);
  }
}

main();
