"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { PlaybackMode } from "bzzz";
import { defaultPatterns, haptics } from "bzzz";
import { PatternBar } from "../components/pattern-bar";
import { InstallCode } from "../components/install-code";
import { CodeBlock } from "../components/code-block";
import { DemoPanel } from "../components/demo-panel";

const patterns = [
  { name: "selection" as const, label: "Selection", code: "haptics.selection()" },
  { name: "success" as const, label: "Success", code: "haptics.success()" },
  { name: "error" as const, label: "Error", code: "haptics.error()" },
  { name: "toggle" as const, label: "Toggle", code: "haptics.toggle()" },
  { name: "snap" as const, label: "Snap", code: "haptics.snap()" },
];

export default function HomePage() {
  const [active, setActive] = useState(patterns[1]);
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [shaking, setShaking] = useState(false);
  const [flashBg, setFlashBg] = useState("");
  const [animKey, setAnimKey] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const shakeRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function trigger(p: (typeof patterns)[number]) {
    const result = haptics[p.name]();
    setActive(p);
    setMode(result.mode);
    setPlayKey((k) => k + 1);

    // Screen shake
    if (shakeRef.current) clearTimeout(shakeRef.current);
    setShaking(true);
    shakeRef.current = setTimeout(() => setShaking(false), 400);

    // Button animation
    if (animRef.current) clearTimeout(animRef.current);
    setAnimKey(p.name);
    animRef.current = setTimeout(() => setAnimKey(null), 500);

    // Background flash
    if (flashRef.current) clearTimeout(flashRef.current);
    setFlashBg(`hero-flash-${p.name}`);
    flashRef.current = setTimeout(() => setFlashBg(""), 600);
  }

  return (
    <>
      <section className={`hero-screen ${flashBg}`}>
        <div className="hero-center">
          <h1 className={shaking ? "shake-heavy" : ""}><img src="/logo.svg" alt="bzzz" height={36} /></h1>
          <p className={`hero-subtitle ${shaking ? "shake-light" : ""}`}>Haptic feedback for the web.</p>

          <div className="hero-demo">
            <div className={`hero-buttons-row ${shaking ? "shake-medium" : ""}`}>
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

            <div className={`hero-bar ${shaking ? "shake-heavy-delayed" : ""}`}>
              <PatternBar pattern={defaultPatterns[active.name]} playKey={playKey} />
            </div>

            <div className={`hero-code-line ${shaking ? "shake-light" : ""}`}>
              <code>{active.code}</code>
              {mode && <span className={`mode-badge mode-${mode}`}>{mode}</span>}
            </div>
          </div>

          <div className={`hero-actions ${shaking ? "shake-medium-delayed" : ""}`}>
            <Link className="hero-btn hero-btn-primary" href="/docs">
              Docs
            </Link>
            <a
              className="hero-btn hero-btn-secondary"
              href="https://github.com/pavlito/bzzz"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>

      <div className="container content">
        <section>
          <h2>Installation</h2>
          <InstallCode />
        </section>

        <section>
          <h2>Usage</h2>
          <p>
            Import the singleton and trigger feedback from a user interaction.
          </p>
          <CodeBlock
            code={`import { haptics } from "bzzz";

button.addEventListener("click", () => {
  haptics.success();
});`}
          />
        </section>

        <DemoPanel />

        <section>
          <h2>Custom patterns</h2>
          <p>Create isolated instances with your own pattern registry.</p>
          <CodeBlock
            code={`import { createHaptics } from "bzzz";

const appHaptics = createHaptics({
  patterns: {
    saveSuccess: [
      { type: "pulse", duration: 20 },
      { type: "gap", duration: 24 },
      { type: "pulse", duration: 80 }
    ]
  }
});

appHaptics.play("saveSuccess");`}
          />
        </section>

        <section>
          <h2>Fallbacks</h2>
          <p>
            The runtime uses native haptics when available and falls back to
            audio. Every call reports what actually happened.
          </p>
          <CodeBlock
            code={`import { haptics } from "bzzz";

const result = haptics.success();
console.log(result.mode); // "haptics" | "audio" | "none"

const caps = haptics.getCapabilities();
// { haptics: boolean, audio: boolean, ios: boolean, reducedMotion: boolean }`}
          />
        </section>
      </div>
    </>
  );
}
