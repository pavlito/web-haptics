import { CodeBlock } from "../../components/code-block";
import { DocDemo } from "../../components/doc-demo";
import { DocsLayout } from "../../components/docs-layout";
import { TriggerButton } from "../../components/trigger-button";

export default function FallbacksPage() {
  return (
    <DocsLayout
      title="Fallbacks"
      description="Web haptics are platform-dependent. The runtime is transparent about what it uses."
      sections={[
        { id: "capability-checks", label: "Capability checks" },
        { id: "mode-reporting", label: "Mode reporting" },
        { id: "user-activation", label: "User activation" },
      ]}
      prev={{ href: "/create-haptics", label: "createHaptics()" }}
    >
      <section>
        <h2 id="capability-checks">Capability checks</h2>
        <p>Read support from the runtime instead of duplicating browser checks.</p>
        <DocDemo
          code={`const caps = haptics.getCapabilities();

console.log(caps.haptics); // navigator.vibrate exists
console.log(caps.audio);   // Web Audio API exists`}
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
        <h2 id="user-activation">User activation</h2>
        <p>
          Even when <code>navigator.vibrate()</code> exists, browsers can reject playback
          outside a user-triggered interaction. That is why audio fallback and
          mode reporting both matter.
        </p>
      </section>
    </DocsLayout>
  );
}
