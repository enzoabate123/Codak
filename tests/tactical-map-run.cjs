// Isolated compilation; no build, app dependencies or live data writes.
const { mkdtempSync, rmSync } = require('node:fs');

const { join } = require('node:path');
const { spawnSync } = require('node:child_process');
const scratch = join(require('node:os').homedir(), 'AppData', 'Local', 'hermes', 'cache', 'scratch');
require('node:fs').mkdirSync(scratch, { recursive: true });
const out = mkdtempSync(join(scratch, 'codak-tactical-test-'));
try {
  const inputs = ['src/types/tactical-map.ts', 'src/lib/tactical-map.ts'];
  if (require('node:fs').existsSync('src/lib/server/tactical-map-storage.ts')) inputs.push('src/lib/server/tactical-map-storage.ts');
  const compiled = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', ...inputs, '--target', 'es2022', '--module', 'commonjs', '--moduleResolution', 'node', '--esModuleInterop', '--strict', '--skipLibCheck', '--rootDir', 'src', '--outDir', out], { stdio: 'inherit' });
  if (compiled.status !== 0) process.exitCode = compiled.status || 1;
  else {
    const tests = require('node:fs').readdirSync('tests').filter(f => /^tactical-map.*\.test\.cjs$/.test(f)).map(f => join('tests', f));
    const result = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit', env: { ...process.env, TACTICAL_TEST_BUILD: out, NODE_PATH: join(process.cwd(), 'node_modules') } });
    process.exitCode = result.status ?? 1;
  }
} finally { rmSync(out, { recursive: true, force: true }); }
