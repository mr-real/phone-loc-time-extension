import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/generated/zones.json', () => ({
  default: {
    '1415': ['America/Los_Angeles'],
    '14155': ['America/Phoenix'],
    '1999': ['America/New_York'],
  },
}));

import { lookupZones } from '../src/zones';

describe('lookupZones longest-prefix matching (fake table)', () => {
  it('prefers the longer prefix', () => {
    expect(lookupZones('4155551234')).toEqual(['America/Phoenix']);
  });
  it('falls back to the shorter prefix', () => {
    expect(lookupZones('4151234567')).toEqual(['America/Los_Angeles']);
  });
  it('matches an unrelated prefix', () => {
    expect(lookupZones('9995551234')).toEqual(['America/New_York']);
  });
  it('returns [] when nothing matches', () => {
    expect(lookupZones('2125551234')).toEqual([]);
  });
});
