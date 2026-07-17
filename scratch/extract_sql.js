const { execSync } = require('child_process');
const fs = require('fs');

try {
  const content = execSync('git show 71d6ca39b284d60e3b0456db444718a6c9582a04:FINAL_DATABASE_RECOVERY.sql', { encoding: 'utf8' });
  fs.writeFileSync('scratch/recovery_utf8.sql', content, 'utf8');
  console.log('Recovery file written in UTF-8');
} catch (e) {
  console.error('Error running git show:', e);
}
