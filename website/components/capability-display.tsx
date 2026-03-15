"use client";

import { useState } from "react";
import { haptics } from "web-haptics";

export function CapabilityDisplay() {
  const [caps, setCaps] = useState<{ haptics: boolean; audio: boolean } | null>(null);
  const [flash, setFlash] = useState(false);

  return (
    <div className="trigger-wrap">
      <button
        type="button"
        className={`trigger-btn ${flash ? "trigger-btn-flash" : ""}`}
        onClick={() => {
          setCaps(haptics.getCapabilities());
          setFlash(true);
          setTimeout(() => setFlash(false), 400);
        }}
      >
        Check capabilities
      </button>
      {caps && (
        <div className="trigger-result">
          <code>
            haptics: {String(caps.haptics)}, audio: {String(caps.audio)}
          </code>
        </div>
      )}
    </div>
  );
}
