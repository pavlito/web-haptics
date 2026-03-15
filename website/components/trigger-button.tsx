"use client";

import { useState } from "react";
import type { PlaybackMode } from "web-haptics";
import { haptics } from "web-haptics";

type TriggerButtonProps = {
  method: "selection" | "success" | "error" | "toggle" | "snap";
};

export function TriggerButton({ method }: TriggerButtonProps) {
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [flash, setFlash] = useState(false);

  return (
    <div className="trigger-wrap">
      <button
        type="button"
        className={`trigger-btn ${flash ? "trigger-btn-flash" : ""}`}
        onClick={() => {
          const result = haptics[method]();
          setMode(result.mode);
          setFlash(true);
          setTimeout(() => setFlash(false), 400);
        }}
      >
        Trigger haptics
      </button>
      {mode && (
        <div className="trigger-result">
          <span className={`mode-badge mode-${mode}`}>{mode}</span>
          <span className="trigger-method">{method}()</span>
        </div>
      )}
    </div>
  );
}
