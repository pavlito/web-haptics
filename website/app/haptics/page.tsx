import { CapabilityDisplay } from "../../components/capability-display";
import { CodeBlock } from "../../components/code-block";
import { DocDemo } from "../../components/doc-demo";
import { DocsLayout } from "../../components/docs-layout";
import { PlayDemo } from "../../components/play-demo";
import { TriggerButton } from "../../components/trigger-button";

export default function HapticsPage() {
  return (
    <DocsLayout
      title="haptics"
      description="The default singleton. Import it and call methods directly."
      sections={[
        { id: "selection", label: "selection()" },
        { id: "success", label: "success()" },
        { id: "error", label: "error()" },
        { id: "toggle", label: "toggle()" },
        { id: "snap", label: "snap()" },
        { id: "play", label: "play()" },
        { id: "get-capabilities", label: "getCapabilities()" },
        { id: "set-enabled", label: "setEnabled" },
        { id: "api-reference", label: "API Reference" },
      ]}
      prev={{ href: "/getting-started", label: "Getting Started" }}
      next={{ href: "/create-haptics", label: "createHaptics()" }}
    >
      <section>
        <h2 id="selection">selection()</h2>
        <p>Quick tap confirmation for selections.</p>
        <DocDemo code={`haptics.selection();`}>
          <TriggerButton method="selection" />
        </DocDemo>
      </section>

      <section>
        <h2 id="success">success()</h2>
        <p>Positive completion feedback.</p>
        <DocDemo code={`haptics.success();`}>
          <TriggerButton method="success" />
        </DocDemo>
      </section>

      <section>
        <h2 id="error">error()</h2>
        <p>Warning or failure response.</p>
        <DocDemo code={`haptics.error();`}>
          <TriggerButton method="error" />
        </DocDemo>
      </section>

      <section>
        <h2 id="toggle">toggle()</h2>
        <p>State change feedback.</p>
        <DocDemo code={`haptics.toggle();`}>
          <TriggerButton method="toggle" />
        </DocDemo>
      </section>

      <section>
        <h2 id="snap">snap()</h2>
        <p>Crisp spatial interaction cue.</p>
        <DocDemo code={`haptics.snap();`}>
          <TriggerButton method="snap" />
        </DocDemo>
      </section>

      <section>
        <h2 id="play">play()</h2>
        <p>Play a raw <code>PatternBlock[]</code> array when you need direct control.</p>
        <DocDemo
          code={`haptics.play([
  { type: "pulse", duration: 20 },
  { type: "gap", duration: 24 },
  { type: "pulse", duration: 60 }
]);`}
        >
          <PlayDemo />
        </DocDemo>
      </section>

      <section>
        <h2 id="get-capabilities">getCapabilities()</h2>
        <p>Check what the current device supports. Returns a <code>CapabilityState</code> object.</p>
        <DocDemo
          code={`const caps = haptics.getCapabilities();
// { haptics: boolean, audio: boolean, ios: boolean }`}
        >
          <CapabilityDisplay />
        </DocDemo>
      </section>
      <section>
        <h2 id="set-enabled">setEnabled</h2>
        <p>
          Globally enable or disable haptic feedback. When disabled, all
          methods return <code>{`{ mode: "none" }`}</code>.
        </p>
        <CodeBlock
          code={`haptics.setEnabled(false); // mute all feedback
haptics.success(); // → { mode: "none" }

haptics.setEnabled(true); // resume
haptics.success(); // → { mode: "haptics" }`}
        />
      </section>
      <section>
        <h2 id="api-reference">API Reference</h2>

        <h3>PlaybackResult</h3>
        <p>Returned by all haptics methods.</p>
        <table className="api-table">
          <thead>
            <tr><th>Prop</th><th>Type</th></tr>
          </thead>
          <tbody>
            <tr><td><code>mode</code></td><td><code>{'"haptics" | "audio" | "none"'}</code></td></tr>
          </tbody>
        </table>

        <h3>CapabilityState</h3>
        <p>Returned by <code>getCapabilities()</code>.</p>
        <table className="api-table">
          <thead>
            <tr><th>Prop</th><th>Type</th></tr>
          </thead>
          <tbody>
            <tr><td><code>haptics</code></td><td><code>boolean</code></td></tr>
            <tr><td><code>audio</code></td><td><code>boolean</code></td></tr>
            <tr><td><code>ios</code></td><td><code>boolean</code></td></tr>
          </tbody>
        </table>

        <h3>PatternBlock</h3>
        <p>Used in <code>play()</code> and <code>createHaptics()</code>.</p>
        <table className="api-table">
          <thead>
            <tr><th>Type</th><th>Fields</th></tr>
          </thead>
          <tbody>
            <tr><td><code>pulse</code></td><td><code>duration: number, intensity?: number (0-1)</code></td></tr>
            <tr><td><code>gap</code></td><td><code>duration: number</code></td></tr>
          </tbody>
        </table>
      </section>
    </DocsLayout>
  );
}
