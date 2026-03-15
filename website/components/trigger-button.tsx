"use client";

import { useState } from "react";
import type { PlaybackMode } from "web-haptics";
import { defaultPatterns, haptics } from "web-haptics";
import { PatternBar } from "./pattern-bar";

type TriggerButtonProps = {
  method: "selection" | "success" | "error" | "toggle" | "snap";
};

export function TriggerButton({ method }: TriggerButtonProps) {
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [flash, setFlash] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const pattern = defaultPatterns[method];

  return (
    <div className="trigger-wrap">
      <button
        type="button"
        className={`trigger-btn ${flash ? "trigger-btn-flash" : ""}`}
        onClick={() => {
          const result = haptics[method]();
          setMode(result.mode);
          setFlash(true);
          setPlayCount((c) => c + 1);
          setTimeout(() => setFlash(false), 400);
        }}
      >
        Trigger haptics
      </button>
      <PatternBar pattern={pattern} playing={playCount > 0} />
      {mode && (
        <div className="trigger-result">
          <span className={`mode-badge mode-${mode}`}>{mode}</span>
          <span className="trigger-method">{method}()</span>
        </div>
      )}
    </div>
  );
}
