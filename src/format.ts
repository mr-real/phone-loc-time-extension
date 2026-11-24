export interface FormatOptions {
  placeNames?: boolean;
}

export function formatZoneTime(zone: string, now: Date = new Date(), locale?: string, _options?: FormatOptions): string | null {
  try {
    const fmt = new Intl.DateTimeFormat(locale, {
      timeZone: zone,
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
    return fmt.format(now);
  } catch {
    return null;
  }
}

export function formatAllZones(zones: string[], now = new Date(), locale?: string, options: FormatOptions = {}): string[] {
  const placeNames = options.placeNames ?? false;
  const includePlaceNames = placeNames === true;
  if (includePlaceNames) {
    const out: string[] = [];
    for (const z of zones) {
      const s = formatZoneTime(z, now, locale, options);
      if (s !== null) {
        const label = z.split('/').pop()?.replace(/_/g, ' ') ?? z;
        out.push(label);
        out.push(s);
      }
    }
    return out;
  } else {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const z of zones) {
      const s = formatZoneTime(z, now, locale, options);
      if (s !== null && !seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
    return out;
  }
}
