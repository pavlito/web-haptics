export const patternMeta = [
  {
    name: "selection" as const,
    label: "Selection",
    description: "Light 2-pulse tap. Use for item picks, option changes, list selections.",
    code: "haptics.selection()",
  },
  {
    name: "success" as const,
    label: "Success",
    description: "Rising 3-pulse. Use after save, submit, or successful completion.",
    code: "haptics.success()",
  },
  {
    name: "error" as const,
    label: "Error",
    description: "Urgent 4-pulse buzz. Use after failed validation or error responses.",
    code: "haptics.error()",
  },
  {
    name: "toggle" as const,
    label: "Toggle",
    description: "Symmetric 3-pulse. Use for on/off switches and checkboxes.",
    code: "haptics.toggle()",
  },
  {
    name: "snap" as const,
    label: "Snap",
    description: "Escalating 5-pulse ramp. Use for drag-snap, slider endpoints, alignment.",
    code: "haptics.snap()",
  },
];

export type PatternMeta = (typeof patternMeta)[number];
