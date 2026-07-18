const mockUnifiedGraph = {
  topics: [
    {
      id: "t1",
      title: "Electronegativity",
      definition: "Electronegativity is defined as the tendency of an atom to attract shared electron pairs in a chemical bond.",
      explanation: "Electronegativity increases across a period from left to right due to increased effective nuclear charge. For instance, Fluorine is highly electronegative. As we move down a group, the atomic radius increases and electronegativity decreases because the valence shell is further from the nucleus.",
      importantPoints: [
        {
          "text": "Increases across a period",
          "source": "Periodic_Notes.pdf (Page 1)"
        },
        {
          "text": "Fluorine has the highest value of 4.0",
          "source": "Periodic_Notes.pdf (Page 1)"
        },
        {
          "text": "Decreases down a group",
          "source": "NCERT_Chapter_3.pdf (Page 4)"
        }
      ],
      examples: [
        {
          "text": "F is more electronegative than Cl",
          "source": "Periodic_Notes.pdf (Page 1)"
        }
      ],
      visualAssets: [
        {
          "subType": "Formula",
          "imageUrl": "https://supabase.co/assets/docA-zeff-crop.png",
          "source": "Periodic_Notes.pdf (Page 1)"
        },
        {
          "subType": "Diagram",
          "imageUrl": "https://supabase.co/assets/docB-trend-crop.png",
          "source": "NCERT_Chapter_3.pdf (Page 4)"
        }
      ],
      pageReferences: [1, 4],
      prerequisites: ["Atomic Structure"],
      relatedTopics: ["Effective Nuclear Charge", "Electron Gain Enthalpy"],
      difficulty: "Medium",
      importanceScore: 9
    }
  ]
};

async function main() {
  console.log('--- TEST NOTEBOOK COMPOSER RENDER ---');

  for (const topic of mockUnifiedGraph.topics) {
    const topicName = topic.title;
    let bestDefinition = topic.definition || '';
    let mergedExplanation = topic.explanation || '';
    const points = topic.importantPoints || [];
    const examples = topic.examples || [];
    const visualAssets = topic.visualAssets || [];

    let body = '';

    // Definition first
    if (bestDefinition) {
      body += `**Definition**:\n> ${bestDefinition}\n\n`;
    }

    // Explanation
    if (mergedExplanation) {
      body += `**Key Explanation**:\n${mergedExplanation}\n\n`;
    }

    // Inline Visual Assets (immediately following explanation)
    if (visualAssets.length > 0) {
      body += `**Visual Snippet**:\n`;
      body += visualAssets.map((v) => {
        const caption = v.subType || 'Source Image';
        const sourceText = v.source ? `\n*Source: ${v.source}*` : '';
        return `![${caption}](${v.imageUrl})${sourceText}`;
      }).join('\n\n') + '\n\n';
    }

    // Worked Examples
    if (examples.length > 0) {
      body += `**Example**:\n`;
      body += examples.map((ex) => {
        const exText = typeof ex === 'object' ? ex.text : ex;
        const exSrc = typeof ex === 'object' && ex.source ? `\n*Source: ${ex.source}*` : '';
        return `> ${exText}${exSrc}`;
      }).join('\n\n') + '\n\n';
    }

    // Important Points
    if (points.length > 0) {
      body += `**Important Points**:\n`;
      body += points.map((p) => {
        const pText = typeof p === 'object' ? p.text : p;
        const pSrc = typeof p === 'object' && p.source ? ` (Source: ${p.source})` : '';
        return `- ${pText}${pSrc}`;
      }).join('\n') + '\n\n';
    }

    // Study Relationships & Metadata (at the bottom)
    body += `---\n`;
    body += `**Study Relationships**:\n`;
    if (topic.prerequisites && topic.prerequisites.length > 0) {
      body += `- **Prerequisites**: ${topic.prerequisites.join(', ')}\n`;
    }
    if (topic.relatedTopics && topic.relatedTopics.length > 0) {
      body += `- **Related Topics**: ${topic.relatedTopics.join(', ')}\n`;
    }
    
    const difficulty = topic.difficulty || 'Medium';
    const importance = topic.importanceScore || 5;
    body += `- **Difficulty**: ${difficulty} | **Importance**: ${importance}/10\n\n`;

    // Global Source Provenance
    const pagesList = topic.pageReferences || [];
    const pagesStr = pagesList.length > 0 ? ` (Pages ${pagesList.join(', ')})` : '';
    body += `*Sources: Compiled from source notes${pagesStr}*`;

    console.log(`## ${topicName}\n`);
    console.log(body);
  }
}

main();
