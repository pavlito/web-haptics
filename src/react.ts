import { useEffect, useRef } from "react";
import { createHaptics, haptics } from "./runtime";
import type {
  CreateHapticsOptions,
  HapticsInstance,
  PatternBlock,
  PlaybackResult,
} from "./types";

type UseHapticsReturn = {
  selection: () => PlaybackResult;
  success: () => PlaybackResult;
  error: () => PlaybackResult;
  toggle: () => PlaybackResult;
  snap: () => PlaybackResult;
  play: (pattern: readonly PatternBlock[]) => PlaybackResult;
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => void;
};

/**
 * React hook for the web-haptics singleton.
 * All returned references are stable (defined on a const object), safe for
 * dependency arrays. Does NOT dispose on unmount — the singleton is shared.
 */
export function useHaptics(): UseHapticsReturn {
  return {
    selection: haptics.selection,
    success: haptics.success,
    error: haptics.error,
    toggle: haptics.toggle,
    snap: haptics.snap,
    play: haptics.play,
    isEnabled: haptics.isEnabled,
    setEnabled: haptics.setEnabled,
  };
}

type UseCreateHapticsReturn = {
  play: (nameOrPattern: string | readonly PatternBlock[]) => PlaybackResult;
  register: (name: string, pattern: readonly PatternBlock[]) => void;
  isEnabled: () => boolean;
  setEnabled: (enabled: boolean) => void;
};

/**
 * React hook that creates an isolated haptics instance.
 * Disposes automatically on unmount. The initial `options` are captured once
 * and not reactive — changing options after mount has no effect.
 */
export function useCreateHaptics(
  options?: CreateHapticsOptions,
): UseCreateHapticsReturn {
  const instanceRef = useRef<HapticsInstance | null>(null);

  if (!instanceRef.current) {
    instanceRef.current = createHaptics(options);
  }

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  const instance = instanceRef.current;

  return {
    play: instance.play,
    register: instance.register,
    isEnabled: instance.isEnabled,
    setEnabled: instance.setEnabled,
  };
}
