/**
 * Run the emulator-backed tests against the TEST emulators.
 *
 * These suites begin by deleting every document and every account, because a
 * rules test has to start from a known board. That is fine against a set of
 * emulators started for the run, and ruinous against the ones a developer has
 * open with a day's work in them — which is exactly what happened once.
 *
 * firebase.test.json keeps its emulators on their own ports so the two can run
 * side by side. `emulators:exec` exports FIRESTORE_EMULATOR_HOST,
 * FIREBASE_AUTH_EMULATOR_HOST and FIREBASE_STORAGE_EMULATOR_HOST for us, but
 * not a functions host — the client SDK has no convention for one — so this
 * script reads the port out of the same config the emulators were started
 * from, rather than repeating the number somewhere it can drift.
 *
 * Usage (from the npm scripts, inside emulators:exec):
 *   node scripts/run-emulator-tests.cjs src/__tests__/rules.test.ts …
 */
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join, dirname } = require('node:path');

const config = JSON.parse(readFileSync(join(__dirname, '..', 'firebase.test.json'), 'utf8'));
const functionsPort = config.emulators.functions.port;

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Name at least one test file.');
  process.exit(2);
}

// vitest's own entry, run by this node, rather than the npx shim. Node
// refuses to spawn a .cmd without a shell, so 'npx.cmd' here failed on
// Windows with no output at all — the emulators started, the tests never ran,
// and the only sign was a bare exit code 1.
// resolve() the manifest, not the bin: vitest's exports map does not
// expose ./vitest.mjs, so asking for it by subpath throws.
const vitest = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs');

const result = spawnSync(
  process.execPath,
  [vitest, 'run', '--no-file-parallelism', ...files],
  {
    stdio: 'inherit',
    env: Object.assign({}, process.env, {
      FUNCTIONS_EMULATOR_HOST: '127.0.0.1:' + functionsPort
    })
  }
);

process.exit(result.status === null ? 1 : result.status);
