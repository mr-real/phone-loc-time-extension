import zoneTable from "./generated/zones.json";

type ZoneTable = Record<string, string[]>;

const table = zoneTable as ZoneTable;

export function lookupZones(national: string): string[] {
  const key = "1" + national;
  for (let len = key.length; len >= 4; len--) {
    const prefix = key.slice(0, len);
    if (prefix in table) {
      return [...table[prefix]];
    }
  }
  return [];
}
