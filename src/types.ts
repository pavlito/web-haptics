export type PulseBlock = {
  type: "pulse";
  duration: number;
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

export type PlaybackMode = "haptics" | "audio" | "none";

export type PlaybackResult = {
  mode: PlaybackMode;
};

export type CapabilityState = {
  haptics: boolean;
  audio: boolean;
};

export type PatternRegistry = Record<string, PatternBlock[]>;

export type CreateHapticsOptions = {
  patterns?: PatternRegistry;
};

export type HapticsApi = {
  selection: () => PlaybackResult;
  success: () => PlaybackResult;
  error: () => PlaybackResult;
  toggle: () => PlaybackResult;
  snap: () => PlaybackResult;
  play: (pattern: readonly PatternBlock[]) => PlaybackResult;
  getCapabilities: () => CapabilityState;
};

export type HapticsInstance = {
  play: (nameOrPattern: string | readonly PatternBlock[]) => PlaybackResult;
  register: (name: string, pattern: readonly PatternBlock[]) => void;
  getCapabilities: () => CapabilityState;
};
