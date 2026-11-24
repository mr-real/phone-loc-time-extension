import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const contentPath = path.join(distDir, 'content.js');
const manifestPath = path.join(distDir, 'manifest.json');

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(contentPath)) fail('dist/content.js not found');
const content = fs.readFileSync(contentPath, 'utf8');

const patterns = [
  { re: /fetch\s*\(/, name: 'fetch' },
  { re: /XMLHttpRequest/, name: 'XMLHttpRequest' },
  { re: /sendBeacon/, name: 'sendBeacon' },
  { re: /WebSocket/, name: 'WebSocket' },
  { re: /EventSource/, name: 'EventSource' },
  { re: /importScripts/, name: 'importScripts' },
];

for (const { re, name } of patterns) {
  const match = content.match(re);
  if (match) {
    const idx = match.index ?? 0;
    const snippet = content.slice(Math.max(0, idx - 40), idx + 80).replace(/\s+/g, ' ');
    fail(`${name} pattern found: ...${snippet}...`);
  }
}

if (!fs.existsSync(manifestPath)) fail('dist/manifest.json not found');
const manifestText = fs.readFileSync(manifestPath, 'utf8');
let manifest;
try {
  manifest = JSON.parse(manifestText);
} catch {
  fail('manifest.json is not valid JSON');
}
for (const key of ['permissions', 'host_permissions', 'background', 'web_accessible_resources']) {
  if (key in manifest) fail(`manifest contains forbidden key: ${key}`);
}

const entries = fs.readdirSync(distDir);
if (entries.length !== 2 || !entries.includes('content.js') || !entries.includes('manifest.json')) {
  fail(`dist/ must contain exactly content.js and manifest.json, found: ${entries.join(', ')}`);
}

console.log('OK: no network APIs found');
