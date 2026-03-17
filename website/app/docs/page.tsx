import { CapabilityDisplay } from "../../components/capability-display";
import { CodeBlock } from "../../components/code-block";
import { DocDemo } from "../../components/doc-demo";
import { DocsLayout } from "../../components/docs-layout";
import { PatternDemo } from "../../components/pattern-demo";
import { PatternEditor } from "../../components/pattern-editor";
import { PlayDemo } from "../../components/play-demo";

export const metadata = {
  title: "Documentation — bzzz",
};

export default function DocsPage() {
  return (
    <DocsLayout
      title="Documentation"
      description="Everything you need to use bzzz."
      sections={[
        { id: "installation", label: "Installation" },
        { id: "basic-usage", label: "Basic usage" },
        { id: "patterns", label: "Patterns" },
        { id: "play", label: "play()" },
        { id: "capabilities", label: "Capabilities & fallbacks" },
        { id: "configuration", label: "Configuration" },
        { id: "create-haptics", label: "createHaptics()" },
        { id: "react", label: "React" },
        { id: "browser-support", label: "Browser support" },
        { id: "api-reference", label: "API Reference" },
        { id: "pattern-editor", label: "Pattern Editor" },
      ]}
    >
      {/* ── Getting Started ── */}

      <section>
        <h2 id="installation">Installation</h2>
        <p>Install the package from your command line.</p>
        <CodeBlock code="npm install bzzz" filename="Terminal" />
      </section>

      <section>
        <h2 id="basic-usage">Basic usage</h2>
        <p>
          Import the <code>haptics</code> singleton and call a named pattern.
          Always trigger from a user interaction — browsers may reject playback
          outside click, tap, or keyboard handlers.
        </p>
        <DocDemo
          code={`import { haptics } from "bzzz";

button.addEventListener("click", () => {
  haptics.success();
  // → { mode: "haptics" | "audio" | "none" }
});`}
        >
          <PlayDemo />
        </DocDemo>
      </section>

      {/* ── Patterns ── */}

      <section>
        <h2 id="patterns">Patterns</h2>
        <p>
          Five built-in patterns for common interaction feedback.
          Each returns a <code>PlaybackResult</code> with the output mode.
        </p>
        <PatternDemo />
      </section>

      {/* ── play() ── */}

      <section>
        <h2 id="play">play()</h2>
        <p>
          Play a raw <code>PatternBlock[]</code> array when you need direct
          control. Each block is a <code>pulse</code> (vibration) or{" "}
          <code>gap</code> (pause). Intensity ranges from 0 to 1 (default: 1.0)
          — lower values produce softer feedback.
        </p>
        <DocDemo
          code={`haptics.play([
  { type: "pulse", duration: 20, intensity: 0.5 },
  { type: "gap", duration: 24 },
  { type: "pulse", duration: 60 }
]);`}
        >
          <PlayDemo />
        </DocDemo>
      </section>

      {/* ── Capabilities & Fallbacks ── */}

      <section>
        <h2 id="capabilities">Capabilities & fallbacks</h2>
        <p>
          The runtime uses native haptics when available and falls back to audio.
          Every call returns a <code>PlaybackResult</code> reporting what
          actually happened.
        </p>
        <DocDemo
          code={`const caps = haptics.getCapabilities();
// { haptics: boolean, audio: boolean, ios: boolean, reducedMotion: boolean }

const result = haptics.success();
console.log(result.mode); // "haptics" | "audio" | "none"`}
        >
          <CapabilityDisplay />
        </DocDemo>
        <p>
          When the user has <code>prefers-reduced-motion: reduce</code> enabled,
          all feedback is automatically suppressed and methods return{" "}
          <code>{`{ mode: "none" }`}</code>. Browsers may also reject playback
          outside user-triggered interactions — that is why mode reporting matters.
        </p>
      </section>

      {/* ── Configuration ── */}

      <section>
        <h2 id="configuration">Configuration</h2>
        <p>
          Globally enable or disable haptic feedback. When disabled, all
          methods return <code>{`{ mode: "none" }`}</code>.
        </p>
        <CodeBlock
          code={`haptics.setEnabled(false); // mute all feedback
haptics.isEnabled();       // → false

haptics.setEnabled(true);  // resume
haptics.success();         // → { mode: "haptics" }`}
        />
        <p>
          Call <code>dispose()</code> to clean up the AudioContext and any
          internal DOM elements. Safe to call multiple times.
        </p>
        <CodeBlock code={`haptics.dispose();`} />
      </section>

      {/* ── createHaptics ── */}

      <section>
        <h2 id="create-haptics">createHaptics()</h2>
        <p>
          Create isolated instances with custom pattern registries. Each
          instance has its own enabled state and does not affect the global
          singleton.
        </p>
        <DocDemo
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
        >
          <PlayDemo />
        </DocDemo>
        <p>
          Add patterns after creation with <code>register()</code>. Call{" "}
          <code>dispose()</code> when the instance is no longer needed.
        </p>
        <CodeBlock
          code={`appHaptics.register("delete", [
  { type: "pulse", duration: 40 },
  { type: "gap", duration: 18 },
  { type: "pulse", duration: 44 }
]);

appHaptics.play("delete");
appHaptics.dispose();`}
        />
      </section>

      {/* ── React ── */}

      <section>
        <h2 id="react">React</h2>
        <p>
          Hooks for React 18+. Available from <code>bzzz/react</code> — no
          extra packages or providers needed.
        </p>

        <h3>useHaptics</h3>
        <p>
          Wraps the global singleton with stable callbacks safe for dependency
          arrays. Does not cause re-renders.
        </p>
        <CodeBlock
          code={`import { useHaptics } from "bzzz/react";

function SaveButton() {
  const { success, error } = useHaptics();

  async function handleSave() {
    try {
      await save();
      success();
    } catch {
      error();
    }
  }

  return <button onClick={handleSave}>Save</button>;
}`}
        />

        <h3>useCreateHaptics</h3>
        <p>
          Creates an isolated instance scoped to the component. Automatically
          disposes on unmount.
        </p>
        <CodeBlock
          code={`import { useCreateHaptics } from "bzzz/react";

function GameController() {
  const haptics = useCreateHaptics({
    patterns: {
      hit: [
        { type: "pulse", duration: 30, intensity: 1.0 },
        { type: "gap", duration: 20 },
        { type: "pulse", duration: 50, intensity: 0.8 },
      ],
    },
  });

  return <button onClick={() => haptics.play("hit")}>Attack</button>;
}`}
        />

        <h3>Enable / Disable</h3>
        <p>
          Both hooks expose <code>isEnabled()</code> and{" "}
          <code>setEnabled()</code> for building settings UIs.
        </p>
        <CodeBlock
          code={`const { isEnabled, setEnabled } = useHaptics();

setEnabled(false); // mute
setEnabled(true);  // resume
isEnabled();       // → boolean`}
        />
      </section>

      {/* ── Browser Support ── */}

      <section>
        <h2 id="browser-support">Browser support</h2>
        <p>
          bzzz adapts to each platform automatically. Native vibration is
          preferred, with audio click fallback when unavailable.
        </p>
        <div className="api-table-wrap"><table className="api-table">
          <thead>
            <tr><th>Platform</th><th>Haptics</th><th>Audio</th><th>How</th></tr>
          </thead>
          <tbody>
            <tr><td>Android Chrome / Edge</td><td>Yes</td><td>Yes</td><td>Vibration API</td></tr>
            <tr><td>Android Firefox</td><td>Yes</td><td>Yes</td><td>Vibration API</td></tr>
            <tr><td>iOS Safari 18+</td><td>Yes</td><td>Yes</td><td>Taptic Engine (switch hack)</td></tr>
            <tr><td>iOS Safari 17.x</td><td>No</td><td>Yes</td><td>Audio only</td></tr>
            <tr><td>iOS Chrome / Firefox</td><td>No</td><td>Yes</td><td>Audio only (WebKit engine)</td></tr>
            <tr><td>Desktop Chrome / Firefox / Safari</td><td>No</td><td>Yes</td><td>Audio only</td></tr>
            <tr><td>SSR / Node.js</td><td>No</td><td>No</td><td>Silent (<code>none</code>)</td></tr>
          </tbody>
        </table></div>
        <p>
          On desktop, demos will return <code>{`{ mode: "audio" }`}</code> or{" "}
          <code>{`{ mode: "none" }`}</code>. For the full haptic experience,
          try on a mobile device.
        </p>
      </section>

      {/* ── API Reference ── */}

      <section>
        <h2 id="api-reference">API Reference</h2>

        <h3>haptics</h3>
        <p>Global singleton. Import from <code>bzzz</code>.</p>
        <div className="api-table-wrap"><table className="api-table">
          <thead>
            <tr><th>Method</th><th>Returns</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><code>selection()</code></td><td><code>PlaybackResult</code></td><td>Light 2-pulse tap</td></tr>
            <tr><td><code>success()</code></td><td><code>PlaybackResult</code></td><td>Rising 3-pulse</td></tr>
            <tr><td><code>error()</code></td><td><code>PlaybackResult</code></td><td>Urgent 4-pulse buzz</td></tr>
            <tr><td><code>toggle()</code></td><td><code>PlaybackResult</code></td><td>Symmetric 3-pulse</td></tr>
            <tr><td><code>snap()</code></td><td><code>PlaybackResult</code></td><td>Escalating 5-pulse ramp</td></tr>
            <tr><td><code>play(pattern)</code></td><td><code>PlaybackResult</code></td><td>Play a <code>PatternBlock[]</code></td></tr>
            <tr><td><code>getCapabilities()</code></td><td><code>CapabilityState</code></td><td>Check device support</td></tr>
            <tr><td><code>setEnabled(bool)</code></td><td><code>void</code></td><td>Enable or disable globally</td></tr>
            <tr><td><code>isEnabled()</code></td><td><code>boolean</code></td><td>Check enabled state</td></tr>
            <tr><td><code>dispose()</code></td><td><code>void</code></td><td>Clean up AudioContext and DOM</td></tr>
          </tbody>
        </table></div>

        <h3>createHaptics(options?)</h3>
        <p>Factory for isolated instances. Import from <code>bzzz</code>.</p>
        <div className="api-table-wrap"><table className="api-table">
          <thead>
            <tr><th>Option</th><th>Type</th><th>Default</th></tr>
          </thead>
          <tbody>
            <tr><td><code>patterns</code></td><td><code>Record&lt;string, PatternBlock[]&gt;</code></td><td><code>{"{}"}</code></td></tr>
          </tbody>
        </table></div>
        <p>Returns a <code>HapticsInstance</code> with <code>play(name | pattern)</code>, <code>register(name, pattern)</code>, <code>getCapabilities()</code>, <code>setEnabled()</code>, <code>isEnabled()</code>, and <code>dispose()</code>.</p>

        <h3>PlaybackResult</h3>
        <div className="api-table-wrap"><table className="api-table">
          <thead>
            <tr><th>Prop</th><th>Type</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><code>mode</code></td><td><code>{'"haptics" | "audio" | "none"'}</code></td><td>Which output was used</td></tr>
          </tbody>
        </table></div>

        <h3>CapabilityState</h3>
        <div className="api-table-wrap"><table className="api-table">
          <thead>
            <tr><th>Prop</th><th>Type</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><code>haptics</code></td><td><code>boolean</code></td><td>Vibration API available</td></tr>
            <tr><td><code>audio</code></td><td><code>boolean</code></td><td>Web Audio API available</td></tr>
            <tr><td><code>ios</code></td><td><code>boolean</code></td><td>iOS / iPadOS device</td></tr>
            <tr><td><code>reducedMotion</code></td><td><code>boolean</code></td><td><code>prefers-reduced-motion</code> active</td></tr>
          </tbody>
        </table></div>

        <h3>PatternBlock</h3>
        <div className="api-table-wrap"><table className="api-table">
          <thead>
            <tr><th>Type</th><th>Fields</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><code>pulse</code></td><td><code>duration: number, intensity?: number</code></td><td>Vibration. Intensity 0–1 (default: 1.0)</td></tr>
            <tr><td><code>gap</code></td><td><code>duration: number</code></td><td>Pause between pulses</td></tr>
          </tbody>
        </table></div>
      </section>

      {/* ── Pattern Editor ── */}

      <section>
        <h2 id="pattern-editor">Pattern Editor</h2>
        <p>
          Draw a pattern or start from a preset. Fine-tune the blocks,
          preview and copy the code.
        </p>
        <PatternEditor />
      </section>
    </DocsLayout>
  );
}
