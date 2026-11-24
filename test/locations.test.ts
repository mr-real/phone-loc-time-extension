import { describe, it, expect } from 'vitest';
import table from '../src/generated/locations.json';
import { lookupLocation } from '../src/locations';

const labels = table as Record<string, string>;

describe('lookupLocation (real table)', () => {
  it('212 is New York', () => {
    expect(lookupLocation('2125551234')).toMatch(/New York/);
  });
  it('toll-free has no location', () => {
    expect(lookupLocation('8005551234')).toBeNull();
  });
  it('unknown prefix returns null', () => {
    expect(lookupLocation('0000000000')).toBeNull();
  });
  it('table is large enough', () => {
    expect(Object.keys(labels).length).toBeGreaterThan(200);
  });
  it('all keys are 1 + 3 digits and all labels are non-empty and short', () => {
    for (const [k, v] of Object.entries(labels)) {
      expect(k, k).toMatch(/^1\d{3}$/);
      expect(v.trim().length, k).toBeGreaterThan(0);
      expect(v.length, k).toBeLessThanOrEqual(80);
    }
  });
  it('labels contain no markup characters', () => {
    for (const [k, v] of Object.entries(labels)) {
      expect(v, k).not.toMatch(/[<>]/);
    }
  });
});
