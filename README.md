# Tel Local Time

Hover a `tel:` link on any page to see the current local time for that phone number's area code. The extension makes no network requests at runtime; the build downloads the zone table (or uses `.cache` if available).

## Build

```bash
npm ci
npm run build
```

The build downloads the zone table, bundles the content script with Vite (IIFE), runs the TypeScript type checker, and verifies no network APIs are present.

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

## Zone table

The zone table is generated at build time by `scripts/fetch-zones.mjs` from Google's libphonenumber map_data.txt. The file is cached in `.cache/map_data.txt`. Rebuild to refresh.

## Limitations

- Time is based on area code only; mobile numbers may be elsewhere.
- Some area codes span multiple time zones; all are shown.
- Toll-free and non-geographic numbers show nothing.
- Tooltip does not appear for links inside closed shadow roots.
- Zone data is a snapshot from the last build.
