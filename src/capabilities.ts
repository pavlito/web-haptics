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
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  // iPadOS masquerades as macOS — check touch capability
  if (navigator.maxTouchPoints > 1) {
    // navigator.platform is deprecated but still needed for Safari on iPadOS
    if (navigator.platform === "MacIntel") return true;
    // Safety net for Chromium browsers where platform may be removed first
    const uad = (navigator as any).userAgentData;
    if (uad?.platform === "macOS") return true;
  }
  return false;
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

