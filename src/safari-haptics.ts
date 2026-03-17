import type { PatternBlock } from "./types";

// Optimal interval between haptic taps for pattern simulation (from ios-vibrator-pro-max research)
const TAP_INTERVAL = 26;

// Persistent off-screen switch element — kept rendered (not display:none)
// so iOS Safari produces Taptic Engine feedback on toggle.
// display:none may prevent haptic triggering on some iOS versions.
let label: HTMLLabelElement | null = null;

function ensureDOM(): void {
  if (label) return;
  if (typeof document === "undefined") return;

  label = document.createElement("label");
  label.ariaHidden = "true";
  Object.assign(label.style, {
    position: "fixed",
    left: "-9999px",
    top: "-9999px",
    opacity: "0.01",
    pointerEvents: "none",
  });

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.ariaHidden = "true";
  input.tabIndex = -1;
  label.appendChild(input);

  document.body.appendChild(label);
}

/**
 * Trigger a single iOS Safari haptic tap.
 *
 * Requirements:
 *  - iOS 17.4+ Safari (switch attribute support)
 *  - iOS 18.0+ for haptic feedback on switch toggle
 *  - iOS 18.4+: must be called within a user gesture handler (click),
 *    grant expires after ~1 second
 */
export function triggerSafariHaptic(): void {
  if (typeof document === "undefined") return;
  ensureDOM();
  label?.click();
}

let pendingTimers: ReturnType<typeof setTimeout>[] = [];

export function playSafariPattern(pattern: readonly PatternBlock[]): void {
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

  // First click fires synchronously — required for iOS 18.4+ user gesture context
  triggerSafariHaptic();

  // Subsequent clicks use minimum TAP_INTERVAL spacing for reliable haptic triggering
  for (let i = 1; i < pulseTimes.length; i++) {
    const delay = Math.max(pulseTimes[i] - pulseTimes[0], i * TAP_INTERVAL);
    pendingTimers.push(setTimeout(() => triggerSafariHaptic(), delay));
  }
}

export function destroySafariHaptic(): void {
  for (const id of pendingTimers) clearTimeout(id);
  pendingTimers = [];
  if (label?.parentNode) label.parentNode.removeChild(label);
  label = null;
}
