import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export interface ParsedTel {
  npa: string;
  national: string;
  e164: string;
}

export function parseTelHref(href: string): ParsedTel | null {
  try {
    let s = href.trim();
    s = s.replace(/^tel:/i, "");
    s = s.split(/[?#]/)[0];
    try {
      s = decodeURIComponent(s);
    } catch {
      // keep s
    }
    s = s.split(";")[0];
    s = s.trim();
    if (!s) return null;

    const p = parsePhoneNumberFromString(s, "US");
    if (!p) return null;
    if (p.countryCallingCode !== "1") return null;
    if (!p.isValid()) return null;
    if (p.nationalNumber.length !== 10) return null;

    return {
      npa: p.nationalNumber.slice(0, 3),
      national: p.nationalNumber,
      e164: p.number,
    };
  } catch {
    return null;
  }
}
