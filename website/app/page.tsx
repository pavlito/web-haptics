import Link from "next/link";
import { CodeBlock } from "../components/code-block";
import { DemoPanel } from "../components/demo-panel";
import { InstallCode } from "../components/install-code";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-preview">
          <div className="hero-card">haptics.selection()</div>
          <div className="hero-card">haptics.success()</div>
          <div className="hero-card">haptics.error()</div>
        </div>
        <h1>bzzz</h1>
        <p>An opinionated haptic feedback library for the web.</p>
        <div className="hero-buttons">
          <Link className="hero-btn hero-btn-primary" href="/docs">
            Docs
          </Link>
          <a className="hero-btn hero-btn-secondary" href="https://github.com/pavlito/bzzz" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
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
