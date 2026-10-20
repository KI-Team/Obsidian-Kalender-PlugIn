'use strict';
// Deterministic local bundler: reads text only; never evaluates plugin source.
// Node.js >=18, no npm dependencies or lifecycle scripts.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let source = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
for (const name of ['core', 'locales', 'draft-modal']) {
  const marker = `require('./${name}')`;
  if (source.split(marker).length !== 2) throw Error('Expected exactly one import: ' + name);
  const moduleText = fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8');
  const bundled = `(() => {\nconst module = { exports: {} };\n${moduleText}\nreturn module.exports;\n})()`;
  source = source.replace(marker, () => bundled);
}
source = '// Generated from src/ by scripts/build.cjs. MIT; original: mrrepac.\n' + source;
if (process.argv.includes('--check')) {
  if (fs.readFileSync(path.join(root, 'main.js'), 'utf8') !== source) {
    console.error('main.js differs from the source bundle.'); process.exitCode = 1;
  } else console.log('Bundle matches source.');
} else { fs.writeFileSync(path.join(root, 'main.js'), source); console.log('Built standalone main.js.'); }
