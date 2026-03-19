"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { PlaybackMode } from "bzzz";
import { defaultPatterns, haptics } from "bzzz";
import { patternMeta } from "../../lib/pattern-meta";
import { WaveformCanvas } from "../../components/waveform-canvas";
import { InstallCode } from "../../components/install-code";
import { CodeBlock } from "../../components/code-block";

export default function V1Page() {
  const [active, setActive] = useState(patternMeta[1]);
  const [mode, setMode] = useState<PlaybackMode | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [animKey, setAnimKey] = useState<string | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function trigger(p: (typeof patternMeta)[number]) {
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
      <section className="v1-hero">
        <h1 className="v1-title">bzzz</h1>
        <p className="v1-subtitle">Haptic and audio feedback for the web.</p>

        <div className="v1-scope">
          <div className="v1-scope-header">
            <div className="v1-scope-dots">
              <span /><span /><span />
            </div>
            <span className="v1-scope-label">{active.label} pattern</span>
          </div>
          <div className="v1-waveform-wrap">
            <WaveformCanvas pattern={patternData} playing={playCount > 0} key={playCount} />
          </div>
        </div>

        <div className="v1-buttons">
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
        </div>

        <div className="v1-code-line">
          <code>{active.code}</code>
          {mode && <span className={`mode-badge mode-${mode}`}>{mode}</span>}
        </div>
      </section>

      <div className="v1-divider" />

      <div className="container content">
        <section>
          <InstallCode />
        </section>

        <section>
          <CodeBlock
            code={`import { haptics } from "bzzz";

button.addEventListener("click", () => {
  haptics.success();
});`}
          />
        </section>

        <div className="v1-footer-links">
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
    </>
  );
}
