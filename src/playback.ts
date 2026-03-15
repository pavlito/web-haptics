import { getAudioContextFactory, getCapabilityState } from "./capabilities";
import type {
  PatternBlock,
  PlaybackResult,
  SoundVariant,
} from "./types";

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AudioContextFactory = getAudioContextFactory();

  if (!AudioContextFactory) {
    return null;
  }

  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new AudioContextFactory();
    } catch {
      return null;
    }
  }

  if (sharedAudioContext.state === "suspended") {
    sharedAudioContext.resume().catch(() => undefined);
  }
  return sharedAudioContext;
}

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

const TAP_DURATION = 0.012;
const TAP_FREQUENCY = 800;
const TAP_GAIN = 0.4;

function scheduleTap(
  context: AudioContext,
  startTime: number,
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(TAP_FREQUENCY, startTime);

  const endTime = startTime + TAP_DURATION;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(TAP_GAIN, startTime + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.start(startTime);
  oscillator.stop(endTime);
}

function scheduleTone(
  context: AudioContext,
  sound: SoundVariant,
  duration: number,
  startTime: number,
): void {
  if (duration < 5) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.connect(gain);
  gain.connect(context.destination);

  const presets: Record<SoundVariant, { frequency: number; type: OscillatorType; gain: number }> = {
    tick: { frequency: 920, type: "square", gain: 0.23 },
    "soft-click": { frequency: 620, type: "triangle", gain: 0.18 },
    buzz: { frequency: 180, type: "sawtooth", gain: 0.30 },
  };

  const preset = presets[sound];
  const attack = 0.002;
  const release = duration < 20
    ? Math.min(0.003, duration / 1000 / 2)
    : Math.min(0.05, duration / 1000 / 2);
  const endTime = startTime + duration / 1000;

  oscillator.type = preset.type;
  oscillator.frequency.setValueAtTime(preset.frequency, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(preset.gain, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    Math.max(startTime + attack + 0.001, endTime - release),
  );

  oscillator.start(startTime);
  oscillator.stop(endTime);
}

function playAudioPattern(
  pattern: readonly PatternBlock[],
  includePulseFallback: boolean,
): boolean {
  const context = getAudioContext();

  if (!context) {
    return false;
  }

  const startTime = context.currentTime + 0.01;
  let cursorMs = 0;
  let scheduled = false;

  for (const block of pattern) {
    if (block.type === "pulse") {
      if (includePulseFallback && block.duration >= 5) {
        scheduleTap(context, startTime + cursorMs / 1000);
        scheduled = true;
      }
      cursorMs += block.duration;
      continue;
    }

    if (block.type === "audio") {
      if (block.duration >= 5) {
        scheduleTone(context, block.sound, block.duration, startTime + cursorMs / 1000);
        scheduled = true;
      }
      cursorMs += block.duration;
      continue;
    }

    cursorMs += block.duration;
  }

  return scheduled;
}

export function playPattern(pattern: readonly PatternBlock[]): PlaybackResult {
  const capabilities = getCapabilityState();
  const vibrationPattern = toVibrationPattern(pattern);

  if (
    vibrationPattern.length > 0 &&
    capabilities.haptics &&
    navigator.vibrate(vibrationPattern)
  ) {
    if (capabilities.audio) {
      try { playAudioPattern(pattern, true); } catch {}
    }

    return { mode: "haptics" };
  }

  if (capabilities.audio) {
    try {
      const played = playAudioPattern(pattern, true);
      return { mode: played ? "audio" : "none" };
    } catch {
      return { mode: "none" };
    }
  }

  return { mode: "none" };
}
