"use client";

import { useState, useRef } from "react";
import type { PlaybackMode } from "bzzz";
import { defaultPatterns, haptics } from "bzzz";
import { PatternBar } from "./pattern-bar";

const patterns = [
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

export function PatternDemo() {
  const [active, setActive] = useState<typeof patterns[number]>(patterns.find(p => p.name === "success")!);
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const flashRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function trigger(p: typeof patterns[number]) {
    const result = haptics[p.name]();
    setActive(p);
    setMode(result.mode);
    setPlayCount((c) => c + 1);

    if (flashRef.current) clearTimeout(flashRef.current);
    setFlash(true);
    flashRef.current = setTimeout(() => setFlash(false), 400);
  }

  const patternData = defaultPatterns[active.name];

  return (
    <div className="pattern-demo">
      <div className="buttons">
        {patterns.map((p) => (
          <button
            key={p.name}
            type="button"
            className={`btn ${active.name === p.name ? "btn-active" : ""}`}
            onClick={() => trigger(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="pattern-demo-body">
        <p className="pattern-demo-desc">{active.description}</p>
        <div className="pattern-demo-preview">
          <button
            type="button"
            className={`trigger-btn ${flash ? "trigger-btn-flash" : ""}`}
            onClick={() => trigger(active)}
          >
            {active.code}
          </button>
          <PatternBar pattern={patternData} playKey={playCount} />
          {mode && (
            <div className="trigger-result">
              <span className={`mode-badge mode-${mode}`}>{mode}</span>
            </div>
          )}
        </div>
        <div className="pattern-demo-code">
          <pre className="code">{active.code}
{"\n"}// → {"{"} mode: &quot;haptics&quot; | &quot;audio&quot; | &quot;none&quot; {"}"}</pre>
        </div>
      </div>
    </div>
  );
}
