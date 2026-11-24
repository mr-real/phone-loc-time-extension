import { parseTelHref } from "./parse";
import { lookupZones } from "./zones";
import { formatAllZones } from "./format";
import { showTooltip, hideTooltip } from "./tooltip";

let currentAnchor: HTMLAnchorElement | null = null;
let pendingTimer: number | null = null;

function findTelAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  const a = target.closest('a[href^="tel:" i]') as HTMLAnchorElement | null;
  return a && a.tagName.toLowerCase() === "a" ? a : null;
}

function clearPending() {
  if (pendingTimer !== null) {
    clearTimeout(pendingTimer);
    pendingTimer = null;
  }
}

function handleMouseOver(e: MouseEvent) {
  try {
    const el = (e.composedPath?.()[0]) as Element || e.target as Element;
    const a = findTelAnchor(el);
    if (!a) return;
    if (a === currentAnchor) return;
    const href = a.getAttribute("href");
    if (!href) return;
    const parsed = parseTelHref(href);
    if (!parsed) return;
    const zones = lookupZones(parsed.national);
    if (zones.length === 0) return;

    clearPending();
    pendingTimer = window.setTimeout(() => {
      currentAnchor = a;
      const lines = formatAllZones(zones);
      if (lines.length === 0) return;
      showTooltip(a, () => formatAllZones(zones));
    }, 150);
  } catch {
    // ignore
  }
}

function handleMouseOut(e: MouseEvent) {
  try {
    const el = (e.composedPath?.()[0]) as Element || e.target as Element;
    const a = findTelAnchor(el);
    if (!a) return;
    const to = e.relatedTarget as Node | null;
    if (to && a.contains(to)) return;
    clearPending();
    currentAnchor = null;
    hideTooltip();
  } catch {
    // ignore
  }
}

function handleScroll() {
  try {
    clearPending();
    currentAnchor = null;
    hideTooltip();
  } catch {}
}

document.addEventListener("mouseover", handleMouseOver, true);
document.addEventListener("mouseout", handleMouseOut, true);
document.addEventListener("scroll", handleScroll, true);
window.addEventListener("blur", () => {
  clearPending();
  currentAnchor = null;
  hideTooltip();
});
