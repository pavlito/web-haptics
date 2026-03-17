import { resetAudioEngine } from "./audio";
import { getCapabilityState } from "./capabilities";
import { clonePattern, defaultPatterns } from "./patterns";
import { playPattern } from "./playback";
import { destroySafariHaptic } from "./safari-haptics";
import type {
  CreateHapticsOptions,
  HapticsApi,
  HapticsInstance,
  NamedPattern,
  PatternBlock,
  PatternRegistry,
} from "./types";

function createRegistry(overrides?: PatternRegistry): Map<string, PatternBlock[]> {
  const registry = new Map<string, PatternBlock[]>();

  for (const [name, pattern] of Object.entries(defaultPatterns)) {
    registry.set(name, clonePattern(pattern));
  }

  if (overrides) {
    for (const [name, pattern] of Object.entries(overrides)) {
      registry.set(name, clonePattern(pattern));
    }
  }

  return registry;
}

function resolvePattern(
  registry: Map<string, PatternBlock[]>,
  nameOrPattern: string | readonly PatternBlock[],
): PatternBlock[] {
  if (typeof nameOrPattern !== "string") {
    return clonePattern(nameOrPattern);
  }

  const pattern = registry.get(nameOrPattern);

  if (!pattern) {
    throw new Error(`Unknown haptics pattern: ${nameOrPattern}`);
  }

  return clonePattern(pattern);
}

let singletonEnabled = true;

function playNamedPattern(name: NamedPattern) {
  return playPattern(clonePattern(defaultPatterns[name]), { enabled: singletonEnabled });
}

export const haptics: HapticsApi = {
  selection: () => playNamedPattern("selection"),
  success: () => playNamedPattern("success"),
  error: () => playNamedPattern("error"),
  toggle: () => playNamedPattern("toggle"),
  snap: () => playNamedPattern("snap"),
  play: (pattern) => playPattern(clonePattern(pattern), { enabled: singletonEnabled }),
  getCapabilities: () => getCapabilityState(),
  setEnabled: (enabled: boolean) => { singletonEnabled = enabled; },
  isEnabled: () => singletonEnabled,
  dispose: () => { resetAudioEngine(); destroySafariHaptic(); },
};

export function createHaptics(
  options: CreateHapticsOptions = {},
): HapticsInstance {
  const registry = createRegistry(options.patterns);
  let enabled = true;

  return {
    play: (nameOrPattern) => playPattern(resolvePattern(registry, nameOrPattern), { enabled }),
    register: (name, pattern) => {
      registry.set(name, clonePattern(pattern));
    },
    getCapabilities: () => getCapabilityState(),
    setEnabled: (value: boolean) => { enabled = value; },
    isEnabled: () => enabled,
    dispose: () => { resetAudioEngine(); destroySafariHaptic(); },
  };
}

export function dispose(): void {
  resetAudioEngine();
  destroySafariHaptic();
}

export function setEnabled(enabled: boolean): void {
  haptics.setEnabled(enabled);
}

export function isEnabled(): boolean {
  return haptics.isEnabled();
}
