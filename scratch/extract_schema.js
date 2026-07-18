const { execSync } = require('child_process');
const fs = require('fs');

try {
  const content = execSync('git show 6907a82ac85fee82fe013d05a843abbc54e1a78b:schema.sql', { encoding: 'utf8' });
  fs.writeFileSync('scratch/schema.sql', content, 'utf8');
  console.log('schema.sql file written');
} catch (e) {
  console.error('Error running git show:', e);
}
