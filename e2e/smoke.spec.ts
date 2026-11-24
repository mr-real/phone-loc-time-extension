import { test, expect, chromium, type BrowserContext, type Page, type Locator } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
let server: http.Server;
let origin = '';
let context: BrowserContext;
let page: Page;
const requests: string[] = [];

test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const file = path.join(root, rel === '/' ? 'test-page.html' : rel);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.statusCode = 404; res.end('not found'); return;
    }
    res.setHeader('Content-Type', file.endsWith('.html') ? 'text/html' : 'text/plain');
    res.end(fs.readFileSync(file));
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${(server.address() as any).port}`;

  context = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 900 },
    args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
  });
  context.on('request', (req) => requests.push(req.url()));
  page = await context.newPage();
  await page.goto(`${origin}/test-page.html`);
});

test.afterAll(async () => {
  await context?.close();
  await new Promise<void>((r) => server.close(() => r()));
});

async function shotAround(link: Locator): Promise<Buffer> {
  const box = (await link.boundingBox())!;
  const clip = {
    x: Math.max(0, box.x - 20),
    y: Math.max(0, box.y - 20),
    width: Math.max(box.width + 400, 420),
    height: box.height + 200,
  };
  return page.screenshot({ clip });
}

async function hoverChangesPixels(link: Locator): Promise<boolean> {
  await page.mouse.move(0, 0);
  await page.waitForTimeout(100);
  await link.scrollIntoViewIfNeeded();
  const before = await shotAround(link);
  await link.hover();
  await page.waitForTimeout(600);
  const after = await shotAround(link);
  await page.mouse.move(0, 0);
  return Buffer.compare(before, after) !== 0;
}

test('valid NANP link shows a tooltip', async () => {
  expect(await hoverChangesPixels(page.locator('a[href="tel:+12024561111"]'))).toBe(true);
});

test('toll-free link shows nothing', async () => {
  expect(await hoverChangesPixels(page.locator('a', { hasText: 'Toll-free' }))).toBe(false);
});

test('UK link shows nothing', async () => {
  expect(await hoverChangesPixels(page.locator('a', { hasText: 'UK' }))).toBe(false);
});

test('mailto link shows nothing', async () => {
  expect(await hoverChangesPixels(page.locator('a', { hasText: 'mailto' }))).toBe(false);
});

test('link inside an iframe shows a tooltip', async () => {
  const link = page.frameLocator('iframe').locator('a[href^="tel:"]').first();
  await link.waitFor({ state: 'visible' });
  expect(await hoverChangesPixels(link)).toBe(true);
});

test('extension made no network requests of its own', () => {
  const foreign = requests.filter((u) => !u.startsWith(origin + '/') && !u.startsWith('data:') && !u.startsWith('about:'));
  expect(foreign).toEqual([]);
});
