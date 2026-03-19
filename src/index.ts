export { getCapabilityState as getCapabilities } from "./capabilities";
export { defaultPatterns } from "./patterns";
export { createHaptics, dispose, haptics, isEnabled, setEnabled } from "./runtime";
export type {
  CapabilityState,
  CreateHapticsOptions,
  GapBlock,
  HapticsApi,
  HapticsInstance,
  NamedPattern,
  OutputMode,
  PatternBlock,
  PatternRegistry,
  PlaybackMode,
  PlaybackResult,
  PlayOptions,
  PulseBlock,
} from "./types";
