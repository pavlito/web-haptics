"use client";

import { useState } from "react";
import type { PlaybackMode } from "web-haptics";
import { haptics } from "web-haptics";
import { PatternBar } from "./pattern-bar";

const customPattern = [
  { type: "pulse" as const, duration: 20 },
  { type: "gap" as const, duration: 24 },
  { type: "pulse" as const, duration: 60 },
];

export function PlayDemo() {
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [flash, setFlash] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  return (
    <div className="trigger-wrap">
      <button
        type="button"
        className={`trigger-btn ${flash ? "trigger-btn-flash" : ""}`}
        onClick={() => {
          const result = haptics.play(customPattern);
          setMode(result.mode);
          setFlash(true);
          setPlayCount((c) => c + 1);
          setTimeout(() => setFlash(false), 400);
        }}
      >
        Run play()
      </button>
      <PatternBar pattern={customPattern} playKey={playCount} />
      {mode && (
        <div className="trigger-result">
          <span className={`mode-badge mode-${mode}`}>{mode}</span>
          <span className="trigger-method">play()</span>
        </div>
      )}
    </div>
  );
}
