import { describe, it, expect } from 'vitest';
import { formatZoneTime, formatAllZones } from '../src/format';

// \s matches the narrow no-break space that newer ICU versions put before AM/PM.
const winter = new Date('2026-01-15T20:00:00Z');
const summer = new Date('2026-07-15T20:00:00Z');
const L = 'en-US';

describe('formatZoneTime', () => {
  it('New York winter is 3:00 PM EST', () => {
    expect(formatZoneTime('America/New_York', winter, L)).toMatch(/3:00\sPM\sEST/);
  });
  it('New York summer is 4:00 PM EDT (DST)', () => {
    expect(formatZoneTime('America/New_York', summer, L)).toMatch(/4:00\sPM\sEDT/);
  });
  it('Phoenix summer is 1:00 PM MST (no DST)', () => {
    expect(formatZoneTime('America/Phoenix', summer, L)).toMatch(/1:00\sPM\sMST/);
  });
  it('Los Angeles winter is 12:00 PM PST', () => {
    expect(formatZoneTime('America/Los_Angeles', winter, L)).toMatch(/12:00\sPM\sPST/);
  });
  it('weekday rolls over across midnight (Thu 03:00Z is still Wed night in New York)', () => {
    expect(formatZoneTime('America/New_York', new Date('2026-01-15T03:00:00Z'), L)).toMatch(/^Wed\b/);
  });
  it('half-hour zone (St Johns) shows 4:30 PM in winter', () => {
    expect(formatZoneTime('America/St_Johns', winter, L)).toMatch(/4:30\sPM/);
  });
  it('invalid zone returns null', () => {
    expect(formatZoneTime('Not/AZone', winter, L)).toBeNull();
  });
  it('empty zone returns null', () => {
    expect(formatZoneTime('', winter, L)).toBeNull();
  });
});

describe('formatAllZones', () => {
  it('de-duplicates identical strings (New York and Detroit are identical in winter)', () => {
    expect(formatAllZones(['America/New_York', 'America/Detroit'], winter, L)).toHaveLength(1);
  });
  it('keeps different times (New York and Chicago)', () => {
    expect(formatAllZones(['America/New_York', 'America/Chicago'], winter, L)).toHaveLength(2);
  });
  it('drops invalid zones but keeps valid ones', () => {
    expect(formatAllZones(['Not/AZone', 'America/Phoenix'], summer, L)).toHaveLength(1);
  });
  it('returns [] when every zone is invalid', () => {
    expect(formatAllZones(['Not/AZone'], summer, L)).toEqual([]);
  });
  it('returns [] for empty input', () => {
    expect(formatAllZones([], summer, L)).toEqual([]);
  });
});
