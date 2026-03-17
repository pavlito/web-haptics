import type { CapabilityState } from "./types";

type GlobalWithAudio = typeof globalThis & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

type NavigatorWithUAData = Navigator & {
  userAgentData?: { platform: string };
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
  // Known limitation: Mac desktops with external touchscreen or Magic Trackpad
  // may report maxTouchPoints > 1, causing a false positive. This is an accepted
  // tradeoff — the Safari checkbox hack silently does nothing on macOS (no Taptic Engine).
  if (navigator.maxTouchPoints > 1) {
    // navigator.platform is deprecated but still needed for Safari on iPadOS
    if (navigator.platform === "MacIntel") return true;
    // Safety net for Chromium browsers where platform may be removed first
    const uad = (navigator as NavigatorWithUAData).userAgentData;
    if (uad?.platform === "macOS") return true;
  }
  return false;
}

function hasVibrationHardware(): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.vibrate !== "function") return false;
  // Desktop browsers expose vibrate() but have no motor.
  // Best heuristic: touch-capable device = likely has vibration motor.
  if (typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches) {
    return true;
  }
  // No touch = desktop = no motor
  return false;
}

function prefersReducedMotion(): boolean {
  if (typeof matchMedia === "undefined") return false;
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getCapabilityState(): CapabilityState {
  return {
    haptics: hasVibrationHardware(),
    audio: Boolean(getAudioContextConstructor()),
    ios: isIOS(),
    reducedMotion: prefersReducedMotion(),
  };
}

