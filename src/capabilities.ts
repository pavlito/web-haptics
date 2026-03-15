import type { CapabilityState } from "./types";

type GlobalWithAudio = typeof globalThis & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextConstructor(): typeof AudioContext | undefined {
  const runtime = globalThis as GlobalWithAudio;
  return runtime.AudioContext ?? runtime.webkitAudioContext;
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function getCapabilityState(): CapabilityState {
  return {
    haptics:
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function",
    audio: Boolean(getAudioContextConstructor()),
    ios: isIOS(),
  };
}

