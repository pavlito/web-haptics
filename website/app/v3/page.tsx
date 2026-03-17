"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { PlaybackMode } from "web-haptics";
import { defaultPatterns, haptics } from "web-haptics";
import { PatternBar } from "../../components/pattern-bar";
import { InstallCode } from "../../components/install-code";
import { CodeBlock } from "../../components/code-block";

const patterns = [
  {
    name: "selection" as const,
    label: "Selection",
    description: "Light 2-pulse tap. Use for item picks, option changes.",
    code: "haptics.selection()",
  },
  {
    name: "success" as const,
    label: "Success",
    description: "Rising 3-pulse. Use after save, submit, or completion.",
    code: "haptics.success()",
  },
  {
    name: "error" as const,
    label: "Error",
    description: "Urgent 4-pulse buzz. Use after failed validation or errors.",
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
    description: "Escalating 5-pulse ramp. Use for drag-snap, slider endpoints.",
    code: "haptics.snap()",
  },
];

export default function V3Page() {
  const [active, setActive] = useState(patterns[1]);
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [animKey, setAnimKey] = useState<string | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function trigger(p: (typeof patterns)[number]) {
    const result = haptics[p.name]();
    setActive(p);
    setMode(result.mode);
    setPlayCount((c) => c + 1);

    if (animRef.current) clearTimeout(animRef.current);
    setAnimKey(p.name);
    animRef.current = setTimeout(() => setAnimKey(null), 500);
  }

  const patternData = defaultPatterns[active.name];

  return (
    <>
      <section className="v3-hero">
        <h1 className="v3-title">web-haptics</h1>
        <p className="v3-subtitle">Haptic feedback for the web.</p>

        <div className="v3-buttons">
          {patterns.map((p) => (
            <button
              key={p.name}
              type="button"
              className={`btn ${active.name === p.name ? "btn-active" : ""} ${animKey === p.name ? `btn-anim-${p.name}` : ""}`}
              onClick={() => trigger(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <p className="v3-desc">{active.description}</p>

        <div className="v3-demo-panel">
          <div className="v3-demo-label">{active.label}</div>
          <div className="v3-bar-wrap">
            <PatternBar pattern={patternData} playKey={playCount} scale={2.5} />
          </div>
        </div>

        <div className="v3-code-line">
          <code>{active.code}</code>
          {mode && <span className={`mode-badge mode-${mode}`}>{mode}</span>}
        </div>
      </section>

      <div className="v3-divider" />

      <div className="container content">
        <section>
          <InstallCode />
        </section>

        <section>
          <CodeBlock
            code={`import { haptics } from "web-haptics";

button.addEventListener("click", () => {
  haptics.success();
});`}
          />
        </section>

        <div className="v3-footer-links">
          <Link className="hero-btn hero-btn-primary" href="/docs">
            Docs
          </Link>
          <a
            className="hero-btn hero-btn-secondary"
            href="https://github.com/pavlito/web-haptics"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </div>
    </>
  );
}
