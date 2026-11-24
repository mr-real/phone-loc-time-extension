export function formatZoneTime(zone: string, now: Date = new Date(), locale?: string): string | null {
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

export function formatAllZones(zones: string[], now = new Date(), locale?: string): string[] {
  const out: string[] = [];
  for (const z of zones) {
    const s = formatZoneTime(z, now, locale);
    if (s !== null && !out.includes(s)) out.push(s);
  }
  return out;
}
