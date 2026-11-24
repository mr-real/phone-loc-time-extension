# Tel Local Time

Hover a `tel:` link on any page to see the current local time for that phone number's area code. Location names are derived from Google libphonenumber geocoding data (English 1.txt) when available, falling back to timezone labels. The extension makes no network requests at runtime; both the zone map and geocoding file are downloaded once at build via `scripts/fetch-zones.mjs` and cached in `.cache/`.

## Build

```bash
npm ci
npm run build
```

The build downloads the zone map and geocoding data, bundles the content script with Vite (IIFE), runs the TypeScript type checker, and verifies no network APIs are present.

## Run tests

```bash
npm test                 # unit tests
npm run test:e2e         # Playwright smoke tests (requires `npx playwright install chromium` once)
make test                # same via Makefile
make e2e                 # same via Makefile
```

`make build`, `make test`, `make check`, `make e2e` are thin wrappers around the npm scripts.

## Load in Brave

1. Run `npm run build`.
2. Open `brave://extensions`.
3. Turn on Developer mode.
4. Click "Load unpacked" and choose the `dist` folder.
5. After rebuilding, click the extension's reload icon in `brave://extensions` and reload the tab.
6. Open `test-page.html` via `file://`. Enable "Allow access to file URLs" on the extension card, or serve it over http.

Hover each link to see the tooltip.

## Data

Zone mapping (`src/generated/zones.json`) and geocoding table (`src/generated/locations.json`) are generated at build time by `scripts/fetch-zones.mjs`:
- Zones from libphonenumber `resources/timezones/map_data.txt`
- Locations from libphonenumber `resources/geocoding/en/1.txt`

Both source files are cached in `.cache/` and regenerated only when changed. The runtime bundle is fully offline.

## Limitations

- Time is based on area code only; mobile numbers may be elsewhere.
- Geocoding names use English libphonenumber geocoding data and are 4–10-digit prefix based (longest-prefix match). Non-US NANP prefixes are excluded at runtime.
- Some area codes span multiple time zones; all times are shown when no geocoded location is available.
- Toll-free and non-geographic numbers show nothing.
- Tooltip does not appear for links inside closed shadow roots.
- Zone and location data are snapshots from the last build.
