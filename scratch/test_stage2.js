const { Groq } = require('groq-sdk');
const fs = require('fs');

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const groqKeyLine = envContent.split('\n').find(line => line.startsWith('GROQ_API_KEY='));
  const apiKey = groqKeyLine ? groqKeyLine.split('=')[1].trim() : '';
  const groq = new Groq({ apiKey });

  // Sample blocks representing two pages of chemistry notes
  const mockBlocks = [
    { type: 'text', subType: 'Heading', content: 'Atomic Structure & Periodic Trends', pageIndex: 0 },
    { type: 'text', subType: 'Definition', content: 'Electronegativity is defined as the tendency of an atom to attract shared electron pairs in a chemical bond.', pageIndex: 0 },
    { type: 'text', subType: 'Paragraph', content: 'Electronegativity increases across a period from left to right due to increased effective nuclear charge.', pageIndex: 0 },
    { type: 'visual', subType: 'Formula', content: 'Z_eff = Z - S', imageUrl: 'https://prjtyfnkskndmsoapity.supabase.co/storage/v1/object/public/assets/zeff.png', pageIndex: 0 },
    { type: 'text', subType: 'Paragraph', content: 'Effective nuclear charge (Z_eff) measures the net positive charge experienced by valence electrons.', pageIndex: 0 },
    { type: 'text', subType: 'Definition', content: 'Electron Gain Enthalpy refers to the energy change when an isolated gaseous atom accepts an electron.', pageIndex: 1 },
    { type: 'text', subType: 'Paragraph', content: 'Electron gain enthalpy generally becomes more negative across a period.', pageIndex: 1 },
    { type: 'visual', subType: 'Diagram', content: 'Periodic trend graph showing ionization energy, electronegativity, and electron affinity', imageUrl: 'https://prjtyfnkskndmsoapity.supabase.co/storage/v1/object/public/assets/trend.png', pageIndex: 1 }
  ];

  console.log('--- TEST STAGE 2: KNOWLEDGE GRAPH EXTRACTION ---');
  const kgPrompt = `Analyze the structural blocks of this document and construct a detailed academic Knowledge Graph.

Document blocks:
${JSON.stringify(mockBlocks)}

Return a JSON object matching this schema:
{
  "topics": [
    {
      "name": "Topic Name",
      "definition": "verbatim definition",
      "explanation": "explanation",
      "importantPoints": ["point"],
      "examples": [],
      "visualAssets": [{"subType": "...", "imageUrl": "..."}],
      "pages": [1]
    }
  ],
  "relationships": [
    {
      "source": "Topic Name",
      "target": "Prerequisite Topic Name",
      "type": "prerequisite"
    }
  ]
}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an elite academic compiler. Extract structured knowledge graphs in JSON format.' },
        { role: 'user', content: kgPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const content = chatCompletion.choices[0]?.message?.content || '{}';
    const kgResult = JSON.parse(content);
    console.log('Extracted Knowledge Graph:');
    console.log(JSON.stringify(kgResult, null, 2));

    console.log('\n--- TEST STAGE 2: TOPIC INTELLIGENCE ENGINE ---');
    const allLocalKGs = [
      { documentName: 'Periodic_Chemistry_Notes.pdf', topics: kgResult.topics, relationships: kgResult.relationships }
    ];

    const tiePrompt = `You are the Topic Intelligence Engine for PDF-Crab.
Identify unique topics, group related concepts, detect prerequisite relationships, and order them logically/pedagogically.

Local Knowledge Graphs:
${JSON.stringify(allLocalKGs)}

Return a JSON object matching this schema:
{
  "sequence": [
    {
      "name": "Topic Name",
      "prerequisites": [],
      "importanceRank": 1,
      "coreConcepts": []
    }
  ]
}`;

    const tieCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are the Topic Intelligence Engine. Resolve pedagogical orderings and output JSON.' },
        { role: 'user', content: tiePrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const tieContent = tieCompletion.choices[0]?.message?.content || '{}';
    const tieResult = JSON.parse(tieContent);
    console.log('Topic Intelligence Sorted Sequence:');
    console.log(JSON.stringify(tieResult, null, 2));

  } catch (err) {
    console.error('Error during Stage 2 test run:', err);
  }
}

main();
