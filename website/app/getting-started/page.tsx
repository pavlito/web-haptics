import { CodeBlock } from "../../components/code-block";
import { DocDemo } from "../../components/doc-demo";
import { DocsLayout } from "../../components/docs-layout";
import { TriggerButton } from "../../components/trigger-button";

export default function GettingStartedPage() {
  return (
    <DocsLayout
      title="Getting Started"
      description="web-haptics is a haptic feedback library for the web. It uses native vibration when available and falls back to audio."
      sections={[
        { id: "installation", label: "Installation" },
        { id: "basic-usage", label: "Basic usage" },
        { id: "trigger-from-interaction", label: "Trigger from interaction" },
        { id: "accessibility", label: "Accessibility" },
      ]}
      next={{ href: "/haptics", label: "haptics" }}
    >
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
