import type { PatternBlock } from "./types";

let checkbox: HTMLInputElement | null = null;
let label: HTMLLabelElement | null = null;

function ensureDOM(): void {
  if (checkbox && label) return;
  if (typeof document === "undefined") return;

  checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "web-haptics-switch";
  checkbox.setAttribute("switch", "");
  // Visually hidden but still in layout — display:none breaks Safari haptic triggering
  Object.assign(checkbox.style, {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
  });

  label = document.createElement("label");
  label.setAttribute("for", "web-haptics-switch");
  Object.assign(label.style, {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "1px",
    height: "1px",
    opacity: "0",
    pointerEvents: "none",
  });

  document.body.appendChild(checkbox);
  document.body.appendChild(label);
}

export function triggerSafariHaptic(): void {
  if (typeof document === "undefined") return;
  ensureDOM();
  label?.click();
}

let pendingTimers: ReturnType<typeof setTimeout>[] = [];

export function playSafariPattern(pattern: readonly PatternBlock[]): void {
  // Cleanup previous timers to prevent accumulation on rapid calls
  for (const id of pendingTimers) clearTimeout(id);
  pendingTimers = [];

  let cursorMs = 0;
  const pulseTimes: number[] = [];

  for (const block of pattern) {
    if (block.type === "pulse" && block.duration >= 5) {
      pulseTimes.push(cursorMs);
    }
    cursorMs += block.duration;
  }

  if (pulseTimes.length === 0) return;

  // First click fires synchronously — required for iOS user gesture context
  triggerSafariHaptic();

  // Subsequent clicks fire at their scheduled times
  for (let i = 1; i < pulseTimes.length; i++) {
    const delay = pulseTimes[i] - pulseTimes[0];
    pendingTimers.push(setTimeout(() => triggerSafariHaptic(), delay));
  }
}

export function destroySafariHaptic(): void {
  if (checkbox?.parentNode) checkbox.parentNode.removeChild(checkbox);
  if (label?.parentNode) label.parentNode.removeChild(label);
  checkbox = null;
  label = null;
}
