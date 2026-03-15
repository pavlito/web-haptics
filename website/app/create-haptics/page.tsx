import { CodeBlock } from "../../components/code-block";
import { DocDemo } from "../../components/doc-demo";
import { DocsLayout } from "../../components/docs-layout";
import { TriggerButton } from "../../components/trigger-button";

export default function CreateHapticsPage() {
  return (
    <DocsLayout
      title="createHaptics()"
      description="Create isolated instances with custom pattern registries."
      sections={[
        { id: "basic-usage", label: "Basic usage" },
        { id: "register", label: "register()" },
      ]}
      prev={{ href: "/haptics", label: "haptics" }}
      next={{ href: "/fallbacks", label: "Fallbacks" }}
    >
      <section>
        <h2 id="basic-usage">Basic usage</h2>
        <p>
          Create an instance with your own patterns. The default <code>haptics</code> singleton is
          not affected.
        </p>
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

    </DocsLayout>
  );
}
