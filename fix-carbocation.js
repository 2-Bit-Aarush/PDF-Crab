const fs = require('fs');
const file = 'C:\\Users\\DELL\\OneDrive\\Documents\\Projects\\PDF-Crab\\app\\page.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Carbocation stability')) {
    lines[i] = lines[i].replace(
      '3&deg; > 2&deg; > 1&deg; > methyl',
      '3&deg; > 2&deg; > 1&deg; > methyl'
    );
    console.log('Fixed line', i+1);
  }
}
fs.writeFileSync(file, lines.join('\n'));
console.log('Done');