let host: HTMLDivElement | null = null;
let shadow: ShadowRoot | null = null;
let tipEl: HTMLDivElement | null = null;
let linesContainer: HTMLDivElement | null = null;

function ensureHost(): void {
  if (host && shadow && tipEl && linesContainer) return;

  host = document.createElement("div");
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.left = "0";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";
  document.documentElement.appendChild(host);

  shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = `
    .tip {
      position: fixed;
      max-width: 280px;
      padding: 8px 10px;
      font: 13px/1.4 system-ui, sans-serif;
      color: #fff;
      background: #222;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,.35);
      white-space: nowrap;
    }
    .loc { font-weight: 600; }
  `;
  shadow.appendChild(style);

  tipEl = document.createElement("div");
  tipEl.className = "tip";
  tipEl.style.display = "none";

  linesContainer = document.createElement("div");
  linesContainer.className = "lines";
  tipEl.appendChild(linesContainer);

  shadow.appendChild(tipEl);
}

export interface TooltipContent {
  location: string | null;
  lines: string[];
}

function updateContent(content: TooltipContent) {
  if (!linesContainer || !tipEl) return;
  while (linesContainer.firstChild) linesContainer.removeChild(linesContainer.firstChild);
  const existingLoc = tipEl.querySelector('.loc');
  if (existingLoc) existingLoc.remove();

  if (content.location) {
    const locDiv = document.createElement("div");
    locDiv.className = "loc";
    locDiv.textContent = content.location;
    tipEl.insertBefore(locDiv, linesContainer);
  }

  for (const line of content.lines) {
    const div = document.createElement("div");
    div.textContent = line;
    linesContainer.appendChild(div);
  }
}

export interface Rect { left: number; top: number; right: number; bottom: number }

export function computePosition(
  anchor: Rect,
  tip: { width: number; height: number },
  viewport: { width: number; height: number },
): { left: number; top: number } {
  let left = anchor.left;
  let top = anchor.bottom + 6;
  if (left + tip.width > viewport.width) left = viewport.width - tip.width - 8;
  if (top + tip.height > viewport.height) top = anchor.top - tip.height - 6;
  return { left: Math.max(4, left), top: Math.max(4, top) };
}

function positionTip(anchor: Element, tip: HTMLDivElement) {
  const rect = anchor.getBoundingClientRect() as DOMRect;
  tip.style.display = "block";
  const tipRect = tip.getBoundingClientRect();
  const pos = computePosition(
    { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
    { width: tipRect.width, height: tipRect.height },
    { width: window.innerWidth, height: window.innerHeight }
  );
  tip.style.left = `${pos.left}px`;
  tip.style.top = `${pos.top}px`;
}

let intervalId: number | null = null;

export function showTooltip(anchor: Element, getContent: () => TooltipContent): void {
  ensureHost();
  if (!tipEl) return;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  const render = () => {
    const content = getContent();
    if (content.lines.length === 0) {
      hideTooltip();
      return;
    }
    updateContent(content);
    positionTip(anchor, tipEl!);
  };
  render();
  intervalId = window.setInterval(render, 1000);
}

export function hideTooltip(): void {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (tipEl) {
    tipEl.style.display = "none";
  }
}
