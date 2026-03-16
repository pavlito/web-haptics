import type { PatternBlock } from "./types";

// Optimal interval between haptic taps for pattern simulation (from ios-vibrator-pro-max research)
const TAP_INTERVAL = 26;

/**
 * Trigger a single iOS Safari haptic tap.
 *
 * Creates a temporary <label> containing an <input type="checkbox" switch>,
 * appends to DOM, clicks the label (which fires Taptic Engine feedback),
 * then immediately removes. This approach is based on tijnjh/ios-haptics.
 *
 * Requirements:
 *  - iOS 17.4+ Safari (switch attribute support)
 *  - iOS 18.0+ for haptic feedback on switch toggle
 *  - iOS 18.4+: must be called within a user gesture handler (click),
 *    grant expires after ~1 second
 */
export function triggerSafariHaptic(): void {
  if (typeof document === "undefined") return;

  const label = document.createElement("label");
  label.ariaHidden = "true";
  label.style.display = "none";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);

  document.head.appendChild(label);
  label.click();
  document.head.removeChild(label);
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
}
