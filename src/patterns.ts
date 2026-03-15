import type { NamedPattern, PatternBlock } from "./types";

export const defaultPatterns = {
  selection: [
    { type: "pulse", duration: 8 },
    { type: "gap", duration: 12 },
    { type: "pulse", duration: 10 },
  ],
  success: [
    { type: "pulse", duration: 15 },
    { type: "gap", duration: 40 },
    { type: "pulse", duration: 25 },
    { type: "gap", duration: 60 },
    { type: "pulse", duration: 35 },
  ],
  error: [
    { type: "pulse", duration: 30 },
    { type: "gap", duration: 30 },
    { type: "pulse", duration: 30 },
    { type: "gap", duration: 30 },
    { type: "pulse", duration: 35 },
    { type: "gap", duration: 30 },
    { type: "pulse", duration: 40 },
  ],
  toggle: [
    { type: "pulse", duration: 12 },
    { type: "gap", duration: 24 },
    { type: "pulse", duration: 18 },
    { type: "gap", duration: 24 },
    { type: "pulse", duration: 12 },
  ],
  snap: [
    { type: "pulse", duration: 8 },
    { type: "gap", duration: 8 },
    { type: "pulse", duration: 10 },
    { type: "gap", duration: 8 },
    { type: "pulse", duration: 12 },
    { type: "gap", duration: 8 },
    { type: "pulse", duration: 14 },
    { type: "gap", duration: 8 },
    { type: "pulse", duration: 16 },
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
