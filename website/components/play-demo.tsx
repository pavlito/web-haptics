"use client";

import { useState } from "react";
import type { PlaybackMode } from "web-haptics";
import { haptics } from "web-haptics";

export function PlayDemo() {
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [flash, setFlash] = useState(false);

  return (
    <div className="trigger-wrap">
      <button
        type="button"
        className={`trigger-btn ${flash ? "trigger-btn-flash" : ""}`}
        onClick={() => {
          const result = haptics.play([
            { type: "pulse", duration: 20 },
            { type: "gap", duration: 24 },
            { type: "audio", sound: "tick", duration: 60 },
          ]);
          setMode(result.mode);
          setFlash(true);
          setTimeout(() => setFlash(false), 400);
        }}
      >
        Run play()
      </button>
      {mode && (
        <div className="trigger-result">
          <span className={`mode-badge mode-${mode}`}>{mode}</span>
          <span className="trigger-method">play()</span>
        </div>
      )}
    </div>
  );
}
