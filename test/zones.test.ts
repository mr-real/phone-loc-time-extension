import { describe, it, expect } from 'vitest';
import table from '../src/generated/zones.json';
import { lookupZones } from '../src/zones';

const zones = table as Record<string, string[]>;

describe('lookupZones', () => {
  it('212 -> New York', () => expect(lookupZones('2125551234')).toContain('America/New_York'));
  it('415 -> Los Angeles', () => expect(lookupZones('4155551234')).toContain('America/Los_Angeles'));
  it('602 -> Phoenix', () => expect(lookupZones('6025551234')).toContain('America/Phoenix'));
  it('416 -> Toronto', () => expect(lookupZones('4165551234')).toContain('America/Toronto'));
  it('876 -> Jamaica', () => expect(lookupZones('8765551234')).toContain('America/Jamaica'));
  it('808 -> Honolulu', () => expect(lookupZones('8085551234')).toContain('Pacific/Honolulu'));
  it('907 -> Anchorage', () => expect(lookupZones('9075551234')).toContain('America/Anchorage'));

  it.each(['800', '888', '877', '866', '855', '844', '833'])(
    'toll-free %s has no zones',
    (npa) => expect(lookupZones(npa + '5551234')).toEqual([]),
  );

  it('unknown prefix returns []', () => {
    expect(lookupZones('0000000000')).toEqual([]);
  });

  it('has at least one multi-zone area code', () => {
    const multi = Object.keys(zones).find((k) => k.length === 4 && zones[k].length > 1);
    expect(multi, 'expected at least one 3-digit area code with several zones').toBeDefined();
    const number = multi!.slice(1) + '5551234';
    expect(lookupZones(number).length).toBeGreaterThan(1);
  });

  it('returns a copy, not the table array itself', () => {
    const first = lookupZones('2125551234');
    first.push('Fake/Zone');
    expect(lookupZones('2125551234')).not.toContain('Fake/Zone');
  });
});

describe('generated table', () => {
  it('is large enough', () => {
    expect(Object.keys(zones).length).toBeGreaterThan(200);
  });
  it('contains only Intl-valid zones', () => {
    for (const prefix of Object.keys(zones)) {
      for (const zone of zones[prefix]) {
        expect(() => new Intl.DateTimeFormat('en-US', { timeZone: zone }), `${prefix} -> ${zone}`).not.toThrow();
      }
    }
  });
});
