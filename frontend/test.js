const { execSync } = require('child_process');
try {
  execSync('cd /Users/shaswat/SENTINEL/sentinel/frontend && npm run dev', { timeout: 10000 });
} catch (e) {
  console.log(e.stdout ? e.stdout.toString() : '');
  console.log(e.stderr ? e.stderr.toString() : '');
}
