import { CapabilityDisplay } from "../../components/capability-display";
import { CodeBlock } from "../../components/code-block";
import { DocDemo } from "../../components/doc-demo";
import { DocsLayout } from "../../components/docs-layout";
import { PlayDemo } from "../../components/play-demo";
import { TriggerButton } from "../../components/trigger-button";

export const metadata = {
  title: "Documentation — web-haptics",
};

export default function DocsPage() {
  return (
    <DocsLayout
      title="Documentation"
      description="Everything you need to use web-haptics."
      sections={[
        { id: "installation", label: "Installation" },
        { id: "basic-usage", label: "Basic usage" },
        { id: "trigger-from-interaction", label: "Trigger from interaction" },
        { id: "selection", label: "selection()" },
        { id: "success", label: "success()" },
        { id: "error", label: "error()" },
        { id: "toggle", label: "toggle()" },
        { id: "snap", label: "snap()" },
        { id: "play", label: "play()" },
        { id: "get-capabilities", label: "getCapabilities()" },
        { id: "set-enabled", label: "setEnabled()" },
        { id: "create-haptics", label: "createHaptics()" },
        { id: "register", label: "register()" },
        { id: "react", label: "React" },
        { id: "react-setup", label: "React setup" },
        { id: "use-haptics", label: "useHaptics" },
        { id: "use-create-haptics", label: "useCreateHaptics" },
        { id: "enable-disable", label: "Enable / Disable" },
        { id: "capability-checks", label: "Capability checks" },
        { id: "mode-reporting", label: "Mode reporting" },
        { id: "reduced-motion", label: "Reduced motion" },
        { id: "user-activation", label: "User activation" },
        { id: "api-reference", label: "API Reference" },
        { id: "accessibility", label: "Accessibility" },
      ]}
    >
      {/* ── Getting Started ── */}

      <section>
        <h2 id="installation">Installation</h2>
        <p>Install the package from your command line.</p>
        <CodeBlock code="npm install web-haptics" filename="Terminal" />
      </section>

      <section>
        <h2 id="basic-usage">Basic usage</h2>
        <p>Import the <code>haptics</code> singleton and call a named pattern.</p>
        <DocDemo
          code={`import { haptics } from "web-haptics";

haptics.success();`}
        >
          <TriggerButton method="success" />
        </DocDemo>
      </section>

      <section>
        <h2 id="trigger-from-interaction">Trigger from interaction</h2>
        <p>
          Browsers may reject haptic playback outside user-initiated events.
          Always trigger from a click, tap, or keyboard handler.
        </p>
        <DocDemo
          code={`button.addEventListener("click", () => {
  haptics.success();
});`}
        >
          <TriggerButton method="success" />
        </DocDemo>
      </section>

      {/* ── haptics singleton ── */}

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
// { haptics: boolean, audio: boolean, ios: boolean, reducedMotion: boolean }`}
        >
          <CapabilityDisplay />
        </DocDemo>
      </section>

      <section>
        <h2 id="set-enabled">setEnabled()</h2>
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

      {/* ── createHaptics ── */}

      <section>
        <h2 id="create-haptics">createHaptics()</h2>
        <p>Create isolated instances with custom pattern registries.</p>
        <DocDemo
          code={`import { createHaptics } from "web-haptics";

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
          <TriggerButton method="success" />
        </DocDemo>
      </section>

      <section>
        <h2 id="register">register()</h2>
        <p>Add patterns after creation.</p>
        <DocDemo
          code={`appHaptics.register("delete", [
  { type: "pulse", duration: 40 },
  { type: "gap", duration: 18 },
  { type: "pulse", duration: 44 }
]);

appHaptics.play("delete");`}
        >
          <TriggerButton method="error" />
        </DocDemo>
      </section>

      {/* ── React ── */}

      <section>
        <h2 id="react">React</h2>
        <p>Hooks for React 18+. Available from <code>web-haptics/react</code>.</p>
      </section>

      <section id="react-setup">
        <h2>React setup</h2>
        <p>
          The React hooks are available from a separate entry point. No extra
          packages needed.
        </p>
        <CodeBlock code={`import { useHaptics } from "web-haptics/react";`} />
      </section>

      <section id="use-haptics">
        <h2>useHaptics</h2>
        <p>
          Wraps the singleton with stable callbacks safe for dependency
          arrays and React re-renders.
        </p>
        <CodeBlock
          code={`import { useHaptics } from "web-haptics/react";

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
      </section>

      <section id="use-create-haptics">
        <h2>useCreateHaptics</h2>
        <p>
          Creates an isolated haptics instance scoped to the component.
          Automatically disposes on unmount.
        </p>
        <CodeBlock
          code={`import { useCreateHaptics } from "web-haptics/react";

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
      </section>

      <section id="enable-disable">
        <h2>Enable / Disable</h2>
        <p>
          Both hooks expose <code>isEnabled()</code> and{" "}
          <code>setEnabled()</code> for building settings UIs.
        </p>
        <CodeBlock
          code={`function HapticsToggle() {
  const { isEnabled, setEnabled } = useHaptics();
  const [on, setOn] = useState(isEnabled());

  return (
    <label>
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => {
          setEnabled(e.target.checked);
          setOn(e.target.checked);
        }}
      />
      Haptic feedback
    </label>
  );
}`}
        />
      </section>

      {/* ── Fallbacks ── */}

      <section>
        <h2 id="capability-checks">Capability checks</h2>
        <p>Read support from the runtime instead of duplicating browser checks.</p>
        <DocDemo
          code={`const caps = haptics.getCapabilities();

console.log(caps.haptics);       // navigator.vibrate exists
console.log(caps.audio);         // Web Audio API exists
console.log(caps.ios);           // iOS haptics available
console.log(caps.reducedMotion); // prefers-reduced-motion active`}
        >
          <TriggerButton method="selection" />
        </DocDemo>
      </section>

      <section>
        <h2 id="mode-reporting">Mode reporting</h2>
        <p>Every call returns a <code>PlaybackResult</code> with the output mode that was actually used.</p>
        <DocDemo
          code={`const result = haptics.success();

if (result.mode === "haptics") {
  // Native vibration was used
}
if (result.mode === "audio") {
  // Audio fallback was used
}
if (result.mode === "none") {
  // Nothing was available
}`}
        >
          <TriggerButton method="success" />
        </DocDemo>
      </section>

      <section>
        <h2 id="reduced-motion">Reduced motion</h2>
        <p>
          When the user has <code>prefers-reduced-motion: reduce</code> enabled in their
          OS settings, all haptic and audio feedback is automatically suppressed.
          The <code>reducedMotion</code> flag in <code>getCapabilities()</code> reflects
          this preference, and all methods return <code>{`{ mode: "none" }`}</code>.
        </p>
      </section>

      <section>
        <h2 id="user-activation">User activation</h2>
        <p>
          Even when <code>navigator.vibrate()</code> exists, browsers can reject playback
          outside a user-triggered interaction. That is why audio fallback and
          mode reporting both matter.
        </p>
      </section>

      {/* ── API Reference ── */}

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
            <tr><td><code>reducedMotion</code></td><td><code>boolean</code></td></tr>
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

      {/* ── Accessibility ── */}

      <section>
        <h2 id="accessibility">Accessibility</h2>
        <p>
          web-haptics automatically respects the <code>prefers-reduced-motion</code> media
          query. Users who have enabled reduced motion in their OS settings will
          not receive any haptic or audio feedback.
        </p>
      </section>
    </DocsLayout>
  );
}
