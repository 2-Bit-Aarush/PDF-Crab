const fs = require('fs');

function classifyBlock(block) {
  const content = (block.content || '').trim();
  const lowContent = content.toLowerCase();
  
  const x1 = block.top_left_x ?? 0;
  const y1 = block.top_left_y ?? 0;
  const x2 = block.bottom_right_x ?? 0;
  const y2 = block.bottom_right_y ?? 0;
  const width = x2 - x1;
  const height = y2 - y1;
  const aspectRatio = width / (height || 1);

  if (block.type === 'table') {
    return { type: 'visual', subType: 'Table' };
  }

  if (block.type === 'equation') {
    if (content.length < 50 && aspectRatio > 4) {
      return { type: 'visual', subType: 'Formula' };
    }
    return { type: 'visual', subType: 'Mathematical Equation' };
  }

  if (block.type === 'image') {
    const isChemistry = /C\d+|H\d+|O\d+|[=-]#|\\rightarrow|\\benzene|ring|bond|valence|reaction/i.test(content);
    const isCircuit = /resistor|capacitor|inductor|voltage|current|circuit|diode|transistor|ground/i.test(content);
    const isFlowchart = /flowchart|process|step|start|end|decision|arrow/i.test(content);
    const isGraph = /axis|axes|graph|plot|versus|vs|curve|coordinate|x-axis|y-axis/i.test(content);
    
    const confidence = block.confidence_score !== undefined ? block.confidence_score : 1.0;
    if (confidence < 0.40) {
      return { type: 'visual', subType: 'Handwritten Annotation' };
    }

    if (isCircuit) return { type: 'visual', subType: 'Circuit Diagram' };

    if (isChemistry) {
      if (lowContent.includes('mechanism') || lowContent.includes('reaction')) {
        return { type: 'visual', subType: 'Reaction Mechanism' };
      }
      if (lowContent.includes('structure') || lowContent.includes('lewis')) {
        return { type: 'visual', subType: 'Lewis Structure' };
      }
      return { type: 'visual', subType: 'Chemistry Equation' };
    }
    if (isFlowchart) return { type: 'visual', subType: 'Flowchart' };
    if (isGraph) return { type: 'visual', subType: 'Graph' };

    return { type: 'visual', subType: 'Diagram' };
  }

  if (block.type === 'list' || /^[*-]\s|^\d+\.\s/i.test(content)) {
    return { type: 'text', subType: 'Bullet List' };
  }

  if (
    block.type === 'heading' || 
    (content.length < 80 && (lowContent.startsWith('topic') || lowContent.startsWith('title') || lowContent.startsWith('chapter') || /^[I|V|X]+\.\s/i.test(content)))
  ) {
    if (lowContent.startsWith('topic:') || lowContent.startsWith('title:')) {
      return { type: 'text', subType: 'Topic Title' };
    }
    return { type: 'text', subType: 'Heading' };
  }

  const isDefinition = /is defined as|refers to|denotes|means\s+that|definition:|refers\s+to\s+the/i.test(content);
  if (isDefinition && content.length < 300) {
    return { type: 'text', subType: 'Definition' };
  }

  return { type: 'text', subType: 'Paragraph' };
}

// Define test cases
const testBlocks = [
  { type: 'table', content: '| Col 1 | Col 2 |\n|---|---|' },
  { type: 'equation', content: 'E = mc^2', top_left_x: 10, top_left_y: 20, bottom_right_x: 210, bottom_right_y: 30 },
  { type: 'equation', content: '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}' },
  { type: 'image', content: '\\benzene - ring + CH_3 - Cl \\rightarrow toluene' },
  { type: 'image', content: 'The reaction mechanism of esterification involves...' },
  { type: 'image', content: 'Resistor R1 connected in series with capacitor C1', confidence_score: 0.8 },
  { type: 'image', content: 'Handwritten scribble here', confidence_score: 0.3 },
  { type: 'text', content: '- First bullet point item' },
  { type: 'text', content: 'Chapter 2. Electromagnetic Waves' },
  { type: 'text', content: 'Electronegativity is defined as the tendency of an atom to attract shared electron pairs.' },
  { type: 'text', content: 'Random background sentence about general properties of atoms.' }
];

console.log('--- RUNNING BLOCK CLASSIFIER TEST SUITE ---');
testBlocks.forEach((block, idx) => {
  const result = classifyBlock(block);
  console.log(`[Block ${idx + 1}] Input Type: "${block.type}"`);
  console.log(`  Content: "${block.content.slice(0, 70)}"`);
  console.log(`  Classification -> Type: "${result.type}", SubType: "${result.subType}"`);
  console.log('-------------------------------------------');
});
