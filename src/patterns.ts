import type { NamedPattern, PatternBlock } from "./types";

export const defaultPatterns = {
  selection: [
    { type: "pulse", duration: 8, intensity: 0.4 },
    { type: "gap", duration: 12 },
    { type: "pulse", duration: 10, intensity: 0.6 },
  ],
  success: [
    { type: "pulse", duration: 15, intensity: 0.4 },
    { type: "gap", duration: 40 },
    { type: "pulse", duration: 25, intensity: 0.7 },
    { type: "gap", duration: 60 },
    { type: "pulse", duration: 35, intensity: 1.0 },
  ],
  error: [
    { type: "pulse", duration: 30, intensity: 0.7 },
    { type: "gap", duration: 30 },
    { type: "pulse", duration: 30, intensity: 0.7 },
    { type: "gap", duration: 30 },
    { type: "pulse", duration: 35, intensity: 0.9 },
    { type: "gap", duration: 30 },
    { type: "pulse", duration: 40, intensity: 1.0 },
  ],
  toggle: [
    { type: "pulse", duration: 12, intensity: 0.5 },
    { type: "gap", duration: 24 },
    { type: "pulse", duration: 18, intensity: 0.8 },
    { type: "gap", duration: 24 },
    { type: "pulse", duration: 12, intensity: 0.5 },
  ],
  snap: [
    { type: "pulse", duration: 8, intensity: 0.3 },
    { type: "gap", duration: 8 },
    { type: "pulse", duration: 10, intensity: 0.5 },
    { type: "gap", duration: 8 },
    { type: "pulse", duration: 12, intensity: 0.7 },
    { type: "gap", duration: 8 },
    { type: "pulse", duration: 14, intensity: 0.9 },
    { type: "gap", duration: 8 },
    { type: "pulse", duration: 16, intensity: 1.0 },
  ],
} as const satisfies Record<NamedPattern, readonly PatternBlock[]>;

for (const pattern of Object.values(defaultPatterns)) {
  Object.freeze(pattern);
  for (const block of pattern) {
    Object.freeze(block);
  }
}
Object.freeze(defaultPatterns);

export function clonePattern(pattern: readonly PatternBlock[]): PatternBlock[] {
  return pattern.map((block) => ({ ...block }));
}
