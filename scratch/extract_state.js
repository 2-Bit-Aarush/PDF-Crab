const { execSync } = require('child_process');
const fs = require('fs');

try {
  const content = execSync('git show 71d6ca39b284d60e3b0456db444718a6c9582a04:DATABASE_STATE.md', { encoding: 'utf8' });
  fs.writeFileSync('scratch/database_state.md', content, 'utf8');
  console.log('Database state file written');
} catch (e) {
  console.error('Error running git show:', e);
}
