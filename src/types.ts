export type PulseBlock = {
  type: "pulse";
  duration: number;
  intensity?: number; // 0-1, default 1.0
};

export type GapBlock = {
  type: "gap";
  duration: number;
};

export type PatternBlock = PulseBlock | GapBlock;

export type NamedPattern =
  | "selection"
  | "success"
  | "error"
  | "toggle"
  | "snap";

export type OutputMode = "auto" | "haptics" | "audio" | "both";

export type PlaybackMode = "haptics" | "audio" | "none";

export type PlaybackResult = {
  /** Primary output channel used */
  mode: PlaybackMode;
  /** Whether vibration/taptic fired this call */
  haptics: boolean;
  /** Whether audio click fired this call */
  audio: boolean;
};

export type PlayOptions = {
  output?: OutputMode;
  enabled?: boolean;
};

export type CapabilityState = {
  haptics: boolean;
  audio: boolean;
  ios: boolean;
  reducedMotion: boolean;
};

export type PatternRegistry = Record<string, PatternBlock[]>;

export type CreateHapticsOptions = {
  patterns?: PatternRegistry;
  output?: OutputMode;
};

export type HapticsApi = {
  selection: () => PlaybackResult;
  success: () => PlaybackResult;
  error: () => PlaybackResult;
  toggle: () => PlaybackResult;
  snap: () => PlaybackResult;
  play: (pattern: readonly PatternBlock[]) => PlaybackResult;
  getCapabilities: () => CapabilityState;
  setEnabled: (enabled: boolean) => void;
  isEnabled: () => boolean;
  setOutput: (mode: OutputMode) => void;
  getOutput: () => OutputMode;
  dispose: () => void;
};

export type HapticsInstance = {
  play: (nameOrPattern: string | readonly PatternBlock[]) => PlaybackResult;
  register: (name: string, pattern: readonly PatternBlock[]) => void;
  getCapabilities: () => CapabilityState;
  setEnabled: (enabled: boolean) => void;
  isEnabled: () => boolean;
  setOutput: (mode: OutputMode) => void;
  getOutput: () => OutputMode;
  dispose: () => void;
};
