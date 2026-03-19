import { getAudioEngine } from "./audio";
import { getCapabilityState } from "./capabilities";
import { playSafariPattern } from "./safari-haptics";
import type { OutputMode, PatternBlock, PlayOptions, PlaybackResult } from "./types";

const PWM_CYCLE = 20; // ms per PWM cycle for intensity simulation

function modulateVibration(duration: number, intensity: number): number[] {
  if (intensity >= 1) return [duration];
  if (intensity <= 0) return [];
  // Short pulses: just use full duration (motor can't modulate sub-20ms)
  if (duration <= PWM_CYCLE) return [duration];
  const onTime = Math.max(1, Math.round(PWM_CYCLE * intensity));
  const offTime = PWM_CYCLE - onTime;
  const result: number[] = [];
  let remaining = duration;
  while (remaining >= PWM_CYCLE) {
    result.push(onTime, offTime);
    remaining -= PWM_CYCLE;
  }
  if (remaining > 0) {
    const remainOn = Math.min(remaining, onTime);
    result.push(remainOn);
    const remainOff = remaining - remainOn;
    if (remainOff > 0) {
      result.push(remainOff);
    }
  }
  return result;
}

function toVibrationPattern(pattern: readonly PatternBlock[]): number[] {
  const result: number[] = [];
  for (const block of pattern) {
    if (block.type === "pulse") {
      const intensity = block.intensity ?? 1;
      const modulated = modulateVibration(block.duration, intensity);
      if (modulated.length > 0) {
        // Merge with previous if needed
        if (result.length > 0 && result.length % 2 === 1) {
          // Last entry is an "on" — add gap of 0 then modulated
          result.push(0, ...modulated);
        } else {
          result.push(...modulated);
        }
      }
    } else if (block.type === "gap") {
      if (result.length === 0) continue;
      if (result.length % 2 === 0) {
        // Last entry is "off" — merge
        result[result.length - 1] += block.duration;
      } else {
        result.push(block.duration);
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
      engine.playTap(startTime + cursorMs / 1000, block.intensity ?? 1);
      scheduled = true;
    }
    cursorMs += block.duration;
  }

  return scheduled;
}

function validatePattern(pattern: readonly PatternBlock[]): PatternBlock[] {
  return pattern.map((b): PatternBlock => {
    const duration = Math.max(0, Number.isFinite(b.duration) ? b.duration : 0);
    if (b.type === "pulse") {
      return {
        type: "pulse",
        duration,
        intensity: b.intensity != null ? Math.max(0, Math.min(1, b.intensity)) : undefined,
      };
    }
    return { type: "gap", duration };
  });
}

function shouldPlayHaptics(output: OutputMode): boolean {
  return output === "auto" || output === "haptics" || output === "both";
}

function shouldPlayAudio(output: OutputMode, hapticsSucceeded: boolean): boolean {
  if (output === "audio" || output === "both") return true;
  if (output === "auto" && !hapticsSucceeded) return true;
  return false;
}

export function playPattern(
  pattern: readonly PatternBlock[],
  options?: PlayOptions,
): PlaybackResult {
  const capabilities = getCapabilityState();
  const output: OutputMode = options?.output ?? "auto";

  if (capabilities.reducedMotion || options?.enabled === false) {
    return { mode: "none", haptics: false, audio: false };
  }

  const validated = validatePattern(pattern);
  const hasPulse = validated.some((b) => b.type === "pulse" && b.duration >= 5);
  let hapticsPlayed = false;
  let audioPlayed = false;

  // Try haptics (iOS or Vibration API)
  if (shouldPlayHaptics(output) && hasPulse) {
    if (capabilities.ios) {
      playSafariPattern(validated);
      hapticsPlayed = true;
    } else {
      const vibrationPattern = toVibrationPattern(validated);
      if (vibrationPattern.length > 0 && capabilities.haptics && navigator.vibrate(vibrationPattern)) {
        hapticsPlayed = true;
      }
    }
  }

  // Try audio
  if (shouldPlayAudio(output, hapticsPlayed) && capabilities.audio) {
    try {
      audioPlayed = playAudioClicks(validated);
    } catch {}
  }

  const mode = hapticsPlayed ? "haptics" : audioPlayed ? "audio" : "none";
  return { mode, haptics: hapticsPlayed, audio: audioPlayed };
}
