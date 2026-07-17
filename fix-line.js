const fs = require('fs');
const file = 'C:\\Users\\DELL\\OneDrive\\Documents\\Projects\\PDF-Crab\\app\\page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the problematic line with properly escaped version (using > for >)
content = content.replace(
  '<p>Carbocation stability: 3&deg; > 2&deg; > 1&deg; > methyl</p>',
  '<p>Carbocation stability: 3&deg; > 2&deg; > 1&deg; > methyl</p>'
);

fs.writeFileSync(file, content);
console.log('Fixed!');