import type { NamedPattern, PatternBlock } from "./types";

export const defaultPatterns = {
  selection: [
    { type: "pulse", duration: 18 },
    { type: "gap", duration: 18 },
    { type: "pulse", duration: 12 },
  ],
  success: [
    { type: "pulse", duration: 22 },
    { type: "gap", duration: 28 },
    { type: "pulse", duration: 34 },
  ],
  error: [
    { type: "pulse", duration: 40 },
    { type: "gap", duration: 18 },
    { type: "pulse", duration: 44 },
  ],
  toggle: [
    { type: "pulse", duration: 16 },
    { type: "gap", duration: 20 },
    { type: "pulse", duration: 20 },
  ],
  snap: [
    { type: "pulse", duration: 12 },
    { type: "gap", duration: 12 },
    { type: "pulse", duration: 14 },
    { type: "gap", duration: 12 },
    { type: "pulse", duration: 18 },
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
