"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useSpring, useTransform } from "framer-motion";
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

// Intensity per pattern — how hard the "impact" hits
const intensityMap: Record<string, number> = {
  selection: 0.4,
  success: 0.7,
  error: 1.0,
  toggle: 0.5,
  snap: 0.8,
};

function useShakeSpring(mass: number, stiffness: number, damping: number) {
  const x = useSpring(0, { mass, stiffness, damping });
  const y = useSpring(0, { mass, stiffness, damping });
  const rotate = useSpring(0, { mass, stiffness, damping });
  return { x, y, rotate };
}

export default function HomePage() {
  const [active, setActive] = useState(patterns[1]);
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [animKey, setAnimKey] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Snappy springs — high stiffness, high damping = fast snap back
  const logo = useShakeSpring(0.3, 2000, 15);      // heavy hit, fast settle
  const subtitle = useShakeSpring(0.2, 2500, 20);  // light, very snappy
  const buttons = useShakeSpring(0.25, 2200, 18);  // medium
  const bar = useShakeSpring(0.4, 1800, 12);       // heaviest, slight wobble
  const codeLine = useShakeSpring(0.15, 3000, 25); // lightest, instant
  const actions = useShakeSpring(0.3, 2000, 16);   // medium

  const kick = useCallback((name: string) => {
    const intensity = intensityMap[name] ?? 0.6;
    const force = 8 * intensity;

    // Random direction for each element — makes it feel organic
    function jolt(spring: ReturnType<typeof useShakeSpring>, scale: number) {
      const angle = Math.random() * Math.PI * 2;
      spring.x.set(Math.cos(angle) * force * scale);
      spring.y.set(Math.sin(angle) * force * scale);
      spring.rotate.set((Math.random() - 0.5) * 3 * scale * intensity);
    }

    // Stagger the kicks slightly
    jolt(logo, 1.0);
    setTimeout(() => jolt(buttons, 0.7), 15);
    setTimeout(() => jolt(bar, 1.2), 30);
    setTimeout(() => jolt(subtitle, 0.4), 10);
    setTimeout(() => jolt(codeLine, 0.3), 20);
    setTimeout(() => jolt(actions, 0.6), 40);
  }, [logo, buttons, bar, subtitle, codeLine, actions]);

  function trigger(p: (typeof patterns)[number]) {
    const result = haptics[p.name]();
    setActive(p);
    setMode(result.mode);
    setPlayKey((k) => k + 1);

    // Spring physics kick
    kick(p.name);

    // Button animation
    if (animRef.current) clearTimeout(animRef.current);
    setAnimKey(p.name);
    animRef.current = setTimeout(() => setAnimKey(null), 500);
  }

  return (
    <>
      <section className="hero-screen">
        <div className="hero-center">
          <motion.h1 style={{ x: logo.x, y: logo.y, rotate: logo.rotate }}>
            <img src="/logo.svg" alt="bzzz" height={36} />
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            style={{ x: subtitle.x, y: subtitle.y }}
          >
            Haptic feedback for the web.
          </motion.p>

          <div className="hero-demo">
            <motion.div
              className="hero-buttons-row"
              style={{ x: buttons.x, y: buttons.y, rotate: buttons.rotate }}
            >
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
            </motion.div>

            <motion.div
              className="hero-bar"
              style={{ x: bar.x, y: bar.y, rotate: bar.rotate }}
            >
              <PatternBar pattern={defaultPatterns[active.name]} playKey={playKey} />
            </motion.div>

            <motion.div
              className="hero-code-line"
              style={{ x: codeLine.x, y: codeLine.y }}
            >
              <code>{active.code}</code>
              {mode && <span className={`mode-badge mode-${mode}`}>{mode}</span>}
            </motion.div>
          </div>

          <motion.div
            className="hero-actions"
            style={{ x: actions.x, y: actions.y, rotate: actions.rotate }}
          >
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
          </motion.div>
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
