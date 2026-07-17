const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Get all commit hashes
  const commits = execSync('git log --format="%H"', { encoding: 'utf8' }).trim().split('\n');
  console.log(`Found ${commits.length} commits.`);

  let found = false;
  for (const commit of commits) {
    const diff = execSync(`git show ${commit}`, { encoding: 'utf8' });
    if (diff.includes('postgresql://') || diff.includes('DATABASE_URL') || diff.includes('password=') || diff.includes('db_password')) {
      console.log(`Potential match found in commit: ${commit}`);
      fs.writeFileSync(`scratch/diff_${commit}.txt`, diff, 'utf8');
      found = true;
    }
  }

  if (!found) {
    console.log('No database credentials found in git history.');
  }
} catch (e) {
  console.error('Error running search:', e);
}
