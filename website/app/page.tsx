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

// Logo SVG paths — b, z, z, z
const logoPaths = [
  "M18.42,14.86c1.39,0,2.81.25,4.24.76,1.43.51,2.83,1.28,4.19,2.33,1.36,1.05,2.48,2.51,3.35,4.4.87,1.88,1.31,4.05,1.31,6.49,0,3.73-.96,6.86-2.88,9.39-1.92,2.53-4.48,4.18-7.69,4.95-3.28.77-6.75.26-10.41-1.52-.7,1.6-1.31,2.69-1.83,3.24l-8.69-3.61c.56-.49,1.11-1.26,1.65-2.3.54-1.05.83-2.25.86-3.61.14-3.1.23-6.01.26-8.71.03-2.7-.03-5.65-.18-8.84-.16-3.19-.29-5.67-.39-7.43-.1-1.76-.31-4.77-.63-9.03L10.99,0c-.13,4.49-.16,9.77-.06,15.87,0,.26,0,.51.01.77,2.76-1.19,5.25-1.78,7.48-1.78ZM19.87,34.38c1.67-.03,3.13-.72,4.37-2.07,1.24-1.34,1.86-2.89,1.86-4.63,0-1.47-.47-2.78-1.41-3.95-.94-1.17-2.16-1.91-3.66-2.22-2.16-.49-4.47-.14-6.91,1.05.1,4.5.21,7.88.31,10.15,2.09,1.15,3.91,1.71,5.44,1.67Z",
  "M53.81,35.59l1.05,7.64c-9.21.24-17.46.77-24.75,1.57l-.31-7.85h.05c4.4-3.8,8.79-8.65,13.19-14.55-3.87.31-7.33.87-10.36,1.67l-2.51-7.95c2.44-.1,6.22-.3,11.33-.58,5.11-.28,8.89-.49,11.33-.63l1.41,7.06h-.26c-.73.94-5.08,6.04-13.03,15.28,3.31-.24,7.6-.8,12.87-1.67Z",
  "M78.46,35.59l1.05,7.64c-9.21.24-17.46.77-24.75,1.57l-.31-7.85h.05c4.4-3.8,8.79-8.65,13.19-14.55-3.87.31-7.33.87-10.36,1.67l-2.51-7.95c2.44-.1,6.22-.3,11.33-.58,5.11-.28,8.89-.49,11.33-.63l1.41,7.06h-.26c-.73.94-5.08,6.04-13.03,15.28,3.31-.24,7.6-.8,12.87-1.67Z",
  "M103.1,35.59l1.05,7.64c-9.21.24-17.46.77-24.75,1.57l-.31-7.85h.05c4.4-3.8,8.79-8.65,13.19-14.55-3.87.31-7.33.87-10.36,1.67l-2.51-7.95c2.44-.1,6.22-.3,11.33-.58,5.11-.28,8.89-.49,11.33-.63l1.41,7.06h-.26c-.73.94-5.08,6.04-13.03,15.28,3.31-.24,7.6-.8,12.87-1.67Z",
];

export default function HomePage() {
  const [active, setActive] = useState(patterns[1]);
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [animKey, setAnimKey] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Logo letters — each vibrates independently
  const letterB = useShakeSpring(0.3, 1500, 5);
  const letterZ1 = useShakeSpring(0.25, 1600, 5);
  const letterZ2 = useShakeSpring(0.3, 1400, 4);
  const letterZ3 = useShakeSpring(0.35, 1300, 4);
  const letterSprings = [letterB, letterZ1, letterZ2, letterZ3];

  // Other elements
  const subtitle = useShakeSpring(0.25, 1500, 5);
  const buttons = useShakeSpring(0.3, 1500, 5);
  const bar = useShakeSpring(0.4, 1200, 4);
  const codeLine = useShakeSpring(0.25, 1500, 5);
  const actions = useShakeSpring(0.35, 1400, 5);

  const kick = useCallback((name: string) => {
    const intensity = intensityMap[name] ?? 0.6;
    const force = 14 * intensity;

    // Random direction per element — all get full force, mass handles the rest
    function jolt(spring: ReturnType<typeof useShakeSpring>) {
      const angle = Math.random() * Math.PI * 2;
      spring.x.set(Math.cos(angle) * force);
      spring.y.set(Math.sin(angle) * force);
      spring.rotate.set((Math.random() - 0.5) * 4 * intensity);
    }

    // Logo letters — staggered like shockwave hitting each letter
    letterSprings.forEach((s, i) => {
      setTimeout(() => jolt(s), i * 12);
    });

    setTimeout(() => jolt(subtitle), 10);
    setTimeout(() => jolt(buttons), 20);
    setTimeout(() => jolt(bar), 30);
    setTimeout(() => jolt(codeLine), 25);
    setTimeout(() => jolt(actions), 40);
  }, [letterSprings, buttons, bar, subtitle, codeLine, actions]);

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
          <h1>
            <svg viewBox="0 0 104.15 44.9" height={36} aria-label="bzzz" role="img">
              {logoPaths.map((d, i) => (
                <motion.path
                  key={i}
                  d={d}
                  fill="currentColor"
                  style={{
                    x: letterSprings[i].x,
                    y: letterSprings[i].y,
                    rotate: letterSprings[i].rotate,
                  }}
                />
              ))}
            </svg>
          </h1>

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
