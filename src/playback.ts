import { getAudioEngine } from "./audio";
import { getCapabilityState } from "./capabilities";
import { playSafariPattern } from "./safari-haptics";
import type { PatternBlock, PlaybackResult } from "./types";

function toVibrationPattern(pattern: readonly PatternBlock[]): number[] {
  const result: number[] = [];
  let lastType: "pulse" | "gap" | null = null;
  for (const block of pattern) {
    if (block.type === "pulse") {
      if (lastType === "pulse") {
        result[result.length - 1] += block.duration;
      } else {
        result.push(block.duration);
      }
      lastType = "pulse";
    } else if (block.type === "gap") {
      if (lastType === null) continue;
      if (lastType === "gap") {
        result[result.length - 1] += block.duration;
      } else {
        result.push(block.duration);
        lastType = "gap";
      }
    }
  }
  return result;
}

function playAudioClicks(pattern: readonly PatternBlock[]): boolean {
  const engine = getAudioEngine();
  if (!engine) return false;

  const startTime = engine.context.currentTime + 0.01;
  let cursorMs = 0;
  let scheduled = false;

  for (const block of pattern) {
    if (block.type === "pulse" && block.duration >= 5) {
      engine.playClick(startTime + cursorMs / 1000);
      scheduled = true;
    }
    cursorMs += block.duration;
  }

  return scheduled;
}

export function playPattern(pattern: readonly PatternBlock[]): PlaybackResult {
  const capabilities = getCapabilityState();
  const vibrationPattern = toVibrationPattern(pattern);

  if (capabilities.safari && pattern.some((b) => b.type === "pulse" && b.duration >= 5)) {
    playSafariPattern(pattern);
    try { playAudioClicks(pattern); } catch {}
    return { mode: "haptics" };
  }

  if (
    vibrationPattern.length > 0 &&
    capabilities.haptics &&
    navigator.vibrate(vibrationPattern)
  ) {
    try { playAudioClicks(pattern); } catch {}
    return { mode: "haptics" };
  }

  if (capabilities.audio) {
    try {
      const played = playAudioClicks(pattern);
      return { mode: played ? "audio" : "none" };
    } catch {
      return { mode: "none" };
    }
  }

  return { mode: "none" };
}
