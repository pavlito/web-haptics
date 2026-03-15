import type { CapabilityState } from "./types";

type GlobalWithAudio = typeof globalThis & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextConstructor(): typeof AudioContext | undefined {
  const runtime = globalThis as GlobalWithAudio;
  return runtime.AudioContext ?? runtime.webkitAudioContext;
}

export function getCapabilityState(): CapabilityState {
  return {
    haptics:
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function",
    audio: Boolean(getAudioContextConstructor()),
  };
}

export function getAudioContextFactory(): typeof AudioContext | undefined {
  return getAudioContextConstructor();
}
