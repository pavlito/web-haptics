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
  const [shakeClass, setShakeClass] = useState("");
  const [animKey, setAnimKey] = useState<string | null>(null);
  const [ripple, setRipple] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const shakeRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const rippleRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function trigger(p: (typeof patterns)[number]) {
    const result = haptics[p.name]();
    setActive(p);
    setMode(result.mode);
    setPlayKey((k) => k + 1);

    if (shakeRef.current) clearTimeout(shakeRef.current);
    setShakeClass(`phone-shake-${p.name}`);
    shakeRef.current = setTimeout(() => setShakeClass(""), 500);

    if (animRef.current) clearTimeout(animRef.current);
    setAnimKey(p.name);
    animRef.current = setTimeout(() => setAnimKey(null), 500);

    if (rippleRef.current) clearTimeout(rippleRef.current);
    setRipple(true);
    rippleRef.current = setTimeout(() => setRipple(false), 600);
  }

  return (
    <>
      <section className="v2-hero">
        <div className={`v2-phone ${shakeClass}`}>
          <div className="v2-phone-notch" />
          <div className="v2-phone-screen">
            <div className="v2-phone-status-bar">
              <span>9:41</span>
              <span className="v2-phone-status-icons">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="17" y="4" width="4" height="16" rx="1"/><rect x="11" y="8" width="4" height="12" rx="1"/><rect x="5" y="12" width="4" height="8" rx="1"/></svg>
              </span>
            </div>

            <div className={`v2-phone-ripple-area ${ripple ? "v2-phone-ripple-active" : ""}`}>
              <div className="v2-phone-ripple-ring v2-phone-ripple-1" />
              <div className="v2-phone-ripple-ring v2-phone-ripple-2" />
              <div className="v2-phone-ripple-ring v2-phone-ripple-3" />
              <div className="v2-phone-haptic-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5.5 12a6.5 6.5 0 0113 0" />
                  <path d="M8 12a4 4 0 018 0" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                  <path d="M2 12a10 10 0 0120 0" />
                </svg>
              </div>
            </div>

            {/* PatternBar inside phone */}
            <div className="v2-phone-bar">
              <PatternBar pattern={defaultPatterns[active.name]} playKey={playKey} />
            </div>

            <div className="v2-phone-pattern-label">{active.label}</div>
          </div>
          <div className="v2-phone-home" />
        </div>

        <div className="v2-hero-text">
          <h1><img src="/logo.svg" alt="bzzz" height={32} /></h1>
          <p>Haptic feedback for the web. Native vibration + audio fallback.</p>

          <div className="v2-buttons">
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

          <div className="v2-code-line">
            <code>{active.code}</code>
            {mode && <span className={`mode-badge mode-${mode}`}>{mode}</span>}
          </div>

          <div className="v2-hero-actions">
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

      <div className="v2-divider" />

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
