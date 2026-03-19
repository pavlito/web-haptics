"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useSpring } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import type { PlaybackMode } from "bzzz";
import { defaultPatterns, haptics } from "bzzz";
import { patternMeta } from "../lib/pattern-meta";
import { PatternBar } from "../components/pattern-bar";
import { InstallCode } from "../components/install-code";
import { CodeBlock } from "../components/code-block";
import { DemoPanel } from "../components/demo-panel";

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
  const [active, setActive] = useState(patternMeta[1]);
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [animKey, setAnimKey] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const logo = useShakeSpring(0.3, 1500, 5);
  const subtitle = useShakeSpring(0.25, 1500, 5);
  const qr = useShakeSpring(0.5, 1000, 3); // heavy, wobbly — sticker feel
  const buttons = useShakeSpring(0.3, 1500, 5);
  const bar = useShakeSpring(0.4, 1200, 4);
  const codeLine = useShakeSpring(0.25, 1500, 5);
  const actions = useShakeSpring(0.35, 1400, 5);

  const kick = useCallback((name: string) => {
    const intensity = intensityMap[name] ?? 0.6;
    const force = 6 * intensity;

    // Subtle jolt — keep layout stable, avoid chaotic displacement
    function jolt(spring: ReturnType<typeof useShakeSpring>) {
      const angle = Math.random() * Math.PI * 2;
      spring.x.set(Math.cos(angle) * force);
      spring.y.set(Math.sin(angle) * force);
      spring.rotate.set((Math.random() - 0.5) * 1.5 * intensity);
    }

    jolt(logo);
    setTimeout(() => jolt(subtitle), 10);
    setTimeout(() => jolt(qr), 50);
    setTimeout(() => jolt(buttons), 20);
    setTimeout(() => jolt(bar), 30);
    setTimeout(() => jolt(codeLine), 25);
    setTimeout(() => jolt(actions), 40);
  }, [logo, buttons, bar, subtitle, codeLine, actions, qr]);

  function trigger(p: (typeof patternMeta)[number]) {
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
            <img src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo.svg`} alt="bzzz" height={64} />
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            style={{ x: subtitle.x, y: subtitle.y }}
          >
            Haptic and audio feedback for the web.
          </motion.p>

          <div className="hero-demo">
            <motion.div
              className="hero-buttons-row"
              style={{ x: buttons.x, y: buttons.y, rotate: buttons.rotate }}
            >
              {patternMeta.map((p) => (
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

      <motion.div
        className="hero-qr"
        style={{ x: qr.x, y: qr.y, rotate: qr.rotate }}
      >
        <div className="hero-qr-sticker">
          <QRCodeSVG
            value="https://pavlito.github.io/bzzz"
            size={80}
            bgColor="transparent"
            fgColor="currentColor"
            level="L"
          />
        </div>
        <p className="hero-qr-text">try this on mobile</p>
      </motion.div>

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
