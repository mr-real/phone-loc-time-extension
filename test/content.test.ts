// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { formatAllZones } from '../src/format';
import { parseTelHref } from '../src/parse';
import zoneTable from '../src/generated/zones.json';
import { lookupZones } from '../src/zones';

const DC = 'tel:+12024561111';      // Eastern time
const LA = 'tel:+14153926700';      // VERIFY: must be a valid 415 (Pacific) number

let capturedRoot: ShadowRoot | null = null;

function tooltipText(): string | null {
  const tip = capturedRoot?.querySelector('.tip') as HTMLElement | null;
  if (!tip) return null;
  if (tip.style.display === 'none') return null;
  return tip.textContent;
}

function hover(el: Element, relatedTarget: Element | null = null) {
  el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true, relatedTarget }));
}
function leave(el: Element, relatedTarget: Element | null = null) {
  el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, composed: true, relatedTarget }));
}

beforeAll(async () => {
  const original = Element.prototype.attachShadow;
  vi.spyOn(Element.prototype, 'attachShadow').mockImplementation(function (this: Element, init: ShadowRootInit) {
    const root = original.call(this, init);
    capturedRoot = root;
    return root;
  });
  await import('../src/content'); // registers document listeners ONCE. Do not resetModules.
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-15T20:00:00Z'));
});

afterEach(() => {
  document.querySelectorAll('a').forEach((a) => leave(a, document.body));
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('sample numbers are valid', () => {
  it('DC and LA parse', () => {
    expect(parseTelHref(DC)).not.toBeNull();
    expect(parseTelHref(LA)).not.toBeNull();
  });
});

describe('hover behavior', () => {
  it('shows the tooltip only after the 150 ms delay', () => {
    document.body.innerHTML = `<a href="${DC}">call</a>`;
    hover(document.querySelector('a')!);
    vi.advanceTimersByTime(149);
    expect(tooltipText()).toBeNull();
    vi.advanceTimersByTime(1);
    const text = tooltipText();
    expect(text).toContain('Washington D.C.');
    for (const line of formatAllZones(['America/New_York'])) expect(text).toContain(line);
  });

  it.each([
    ['mailto link', 'mailto:a@b.com'],
    ['UK number', 'tel:+442071838750'],
    ['toll-free number', 'tel:+18005551234'],
    ['garbage percent-encoding', 'tel:%E0%A4%A'],
  ])('shows nothing for %s', (_name, href) => {
    document.body.innerHTML = `<a href="${href}">x</a>`;
    expect(() => hover(document.querySelector('a')!)).not.toThrow();
    vi.advanceTimersByTime(1000);
    expect(tooltipText()).toBeNull();
  });

  it('matches an uppercase TEL: scheme', () => {
    document.body.innerHTML = `<a href="TEL:+12024561111">x</a>`;
    hover(document.querySelector('a')!);
    vi.advanceTimersByTime(150);
    expect(tooltipText()).not.toBeNull();
  });

  it('hides on mouseout', () => {
    document.body.innerHTML = `<a href="${DC}">x</a>`;
    const a = document.querySelector('a')!;
    hover(a);
    vi.advanceTimersByTime(150);
    expect(tooltipText()).not.toBeNull();
    leave(a, document.body);
    expect(tooltipText()).toBeNull();
  });

  it('does not hide when the mouse moves to a child of the same link', () => {
    document.body.innerHTML = `<a href="${DC}"><span>call</span></a>`;
    const a = document.querySelector('a')!;
    const span = document.querySelector('span')!;
    hover(span);
    vi.advanceTimersByTime(150);
    expect(tooltipText()).not.toBeNull();
    leave(a, span);
    expect(tooltipText()).not.toBeNull();
    leave(a, document.body);
    expect(tooltipText()).toBeNull();
  });

  it('cancels the show when the mouse leaves before the delay expires', () => {
    document.body.innerHTML = `<a href="${DC}">x</a>`;
    const a = document.querySelector('a')!;
    hover(a);
    vi.advanceTimersByTime(100);
    leave(a, document.body);
    vi.advanceTimersByTime(1000);
    expect(tooltipText()).toBeNull();
  });

  it('switches to the second link when hovering a different link', () => {
    document.body.innerHTML = `<a id="a" href="${DC}">a</a><a id="b" href="${LA}">b</a>`;
    hover(document.getElementById('a')!);
    vi.advanceTimersByTime(100);
    hover(document.getElementById('b')!);
    vi.advanceTimersByTime(150);
    const text = tooltipText()!;
    for (const line of formatAllZones(['America/Los_Angeles'])) expect(text).toContain(line);
    for (const line of formatAllZones(['America/New_York'])) expect(text).not.toContain(line);
  });

  it('refreshes the clock while visible', () => {
    document.body.innerHTML = `<a href="${DC}">x</a>`;
    hover(document.querySelector('a')!);
    vi.advanceTimersByTime(150);
    const before = tooltipText();
    vi.advanceTimersByTime(60_000);
    const after = tooltipText();
    expect(after).not.toBe(before);
    for (const line of formatAllZones(['America/New_York'])) expect(after).toContain(line);
  });

  it('stops refreshing and stays hidden after mouseout', () => {
    document.body.innerHTML = `<a href="${DC}">x</a>`;
    const a = document.querySelector('a')!;
    hover(a);
    vi.advanceTimersByTime(150);
    leave(a, document.body);
    vi.advanceTimersByTime(5000);
    expect(tooltipText()).toBeNull();
  });

  it('hides on scroll', () => {
    document.body.innerHTML = `<a href="${DC}">x</a>`;
    hover(document.querySelector('a')!);
    vi.advanceTimersByTime(150);
    document.dispatchEvent(new Event('scroll'));
    expect(tooltipText()).toBeNull();
  });

  it('hides on window blur', () => {
    document.body.innerHTML = `<a href="${DC}">x</a>`;
    hover(document.querySelector('a')!);
    vi.advanceTimersByTime(150);
    window.dispatchEvent(new Event('blur'));
    expect(tooltipText()).toBeNull();
  });

  it('shows one line per distinct time for a multi-zone area code', () => {
    const table = zoneTable as Record<string, string[]>;
    const prefix = Object.keys(table).find(
      (k) => k.length === 4 && formatAllZones(table[k]).length > 1,
    );
    expect(prefix, 'need an area code whose zones format to different times').toBeDefined();
    const number = prefix!.slice(1) + '2345678';
    const href = `tel:+1${number}`;
    expect(parseTelHref(href)).not.toBeNull();
    document.body.innerHTML = `<a href="${href}">x</a>`;
    hover(document.querySelector('a')!);
    vi.advanceTimersByTime(150);
    const text = tooltipText()!;
    for (const line of formatAllZones(lookupZones(number))) expect(text).toContain(line);
  });
});
