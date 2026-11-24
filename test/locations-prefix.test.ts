import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/generated/locations.json', () => ({
  default: {
    '1415': 'California',
    '1415392': 'San Francisco, CA',
    '1999': 'Testville',
  },
}));

import { lookupLocation } from '../src/locations';

describe('lookupLocation longest-prefix matching (fake table)', () => {
  it('prefers the longer prefix', () => {
    expect(lookupLocation('4153926700')).toBe('San Francisco, CA');
  });
  it('falls back to the shorter prefix', () => {
    expect(lookupLocation('4151234567')).toBe('California');
  });
  it('matches an unrelated prefix', () => {
    expect(lookupLocation('9995551234')).toBe('Testville');
  });
  it('returns null when nothing matches', () => {
    expect(lookupLocation('2125551234')).toBeNull();
  });
});
