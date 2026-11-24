import locationTable from "./generated/locations.json";

const table = locationTable as Record<string, string>;

/** Geocoded location for a 10-digit NANP national number, or null if unknown. */
export function lookupLocation(national: string): string | null {
  const key = "1" + national;
  for (let length = key.length; length >= 4; length--) {
    const label = table[key.slice(0, length)];
    if (label) return label;
  }
  return null;
}
