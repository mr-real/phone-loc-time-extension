import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://raw.githubusercontent.com/google/libphonenumber/master/resources/timezones/map_data.txt';
const cachePath = path.resolve('.cache/map_data.txt');
const outPath = path.resolve('src/generated/zones.json');

function ensureDir(p) {
  const dir = path.dirname(p);
  fs.mkdirSync(dir, { recursive: true });
}

async function fetchMapData() {
  ensureDir(cachePath);
  let text;
  let usedCache = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
    fs.writeFileSync(cachePath, text, 'utf8');
  } catch (err) {
    if (fs.existsSync(cachePath)) {
      console.warn('WARNING: Failed to download map_data.txt, using cached copy.');
      text = fs.readFileSync(cachePath, 'utf8');
      usedCache = true;
    } else {
      console.error('ERROR: Failed to download map_data.txt and no cache exists.');
      process.exit(1);
    }
  }

  // Parse
  const lines = text.split(/\r?\n/);
  const zoneMap = {};
  let malformed = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('|');
    if (idx === -1) {
      malformed++;
      continue;
    }
    const prefix = line.slice(0, idx).trim();
    const zonesPart = line.slice(idx + 1).trim();
    if (!prefix.startsWith('1')) continue;
    const zones = zonesPart.split('&').map(z => z.trim()).filter(z => z && z !== 'Etc/Unknown');
    if (zones.length === 0) continue;

    // Validate zones
    const validZones = [];
    for (const zone of zones) {
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone });
        validZones.push(zone);
      } catch {
        console.warn(`WARNING: Invalid zone ${zone} for prefix ${prefix}`);
      }
    }
    if (validZones.length === 0) continue;
    zoneMap[prefix] = validZones;
  }

  // Sanity checks
  const rowCount = Object.keys(zoneMap).length;
  if (rowCount < 200) {
    console.error(`ERROR: Only ${rowCount} rows after parsing, expected at least 200.`);
    process.exit(1);
  }
  const checks = [
    ['1212', 'America/New_York'],
    ['1415', 'America/Los_Angeles'],
    ['1602', 'America/Phoenix'],
  ];
  for (const [pref, zone] of checks) {
    if (!zoneMap[pref] || !zoneMap[pref].includes(zone)) {
      console.error(`ERROR: Sanity check failed for prefix ${pref} expecting zone ${zone}`);
      process.exit(1);
    }
  }

  ensureDir(outPath);
  const sortedKeys = Object.keys(zoneMap).sort();
  const ordered = {};
  for (const k of sortedKeys) ordered[k] = zoneMap[k];
  fs.writeFileSync(outPath, JSON.stringify(ordered, null, 2), 'utf8');

  console.log(`Summary: ${rowCount} rows written, ${malformed} malformed lines skipped. ${usedCache ? 'Used cache.' : 'Fresh download.'}`);
}
await fetchMapData();
