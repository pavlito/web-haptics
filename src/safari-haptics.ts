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
  checkbox.style.display = "none";

  label = document.createElement("label");
  label.setAttribute("for", "web-haptics-switch");
  label.style.display = "none";

  document.body.appendChild(checkbox);
  document.body.appendChild(label);
}

export function triggerSafariHaptic(): void {
  if (typeof document === "undefined") return;
  ensureDOM();
  label?.click();
}

export function playSafariPattern(pattern: readonly PatternBlock[]): void {
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
    setTimeout(() => triggerSafariHaptic(), delay);
  }
}

export function destroySafariHaptic(): void {
  if (checkbox?.parentNode) checkbox.parentNode.removeChild(checkbox);
  if (label?.parentNode) label.parentNode.removeChild(label);
  checkbox = null;
  label = null;
}
