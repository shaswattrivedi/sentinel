const { execSync } = require('child_process');
execSync('cd /Users/shaswat/SENTINEL/sentinel/frontend && npm i && npm run build', { stdio: 'inherit' });
