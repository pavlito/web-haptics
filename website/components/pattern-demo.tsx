"use client";

import { useState, useRef } from "react";
import type { PlaybackMode } from "bzzz";
import { defaultPatterns, haptics } from "bzzz";
import { patternMeta, type PatternMeta } from "../lib/pattern-meta";
import { PatternBar } from "./pattern-bar";

export function PatternDemo() {
  const [active, setActive] = useState<PatternMeta>(patternMeta.find(p => p.name === "success")!);
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const flashRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function trigger(p: PatternMeta) {
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
        {patternMeta.map((p) => (
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
