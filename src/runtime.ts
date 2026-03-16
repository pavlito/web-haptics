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

function playNamedPattern(name: NamedPattern) {
  return playPattern(clonePattern(defaultPatterns[name]));
}

export const haptics: HapticsApi = {
  selection: () => playNamedPattern("selection"),
  success: () => playNamedPattern("success"),
  error: () => playNamedPattern("error"),
  toggle: () => playNamedPattern("toggle"),
  snap: () => playNamedPattern("snap"),
  play: (pattern) => playPattern(clonePattern(pattern)),
  getCapabilities: () => getCapabilityState(),
  dispose: () => { resetAudioEngine(); destroySafariHaptic(); },
};

export function createHaptics(
  options: CreateHapticsOptions = {},
): HapticsInstance {
  const registry = createRegistry(options.patterns);

  return {
    play: (nameOrPattern) => playPattern(resolvePattern(registry, nameOrPattern)),
    register: (name, pattern) => {
      registry.set(name, clonePattern(pattern));
    },
    getCapabilities: () => getCapabilityState(),
    dispose: () => { resetAudioEngine(); destroySafariHaptic(); },
  };
}

export function dispose(): void {
  resetAudioEngine();
  destroySafariHaptic();
}
