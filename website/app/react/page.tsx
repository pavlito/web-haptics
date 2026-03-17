import { CodeBlock } from "../../components/code-block";
import { DocsLayout } from "../../components/docs-layout";

export const metadata = {
  title: "React — web-haptics",
};

const sections = [
  { id: "installation", label: "Installation" },
  { id: "usehaptics", label: "useHaptics" },
  { id: "usecreatehaptics", label: "useCreateHaptics" },
  { id: "enable-disable", label: "Enable / Disable" },
];

export default function ReactPage() {
  return (
    <DocsLayout
      title="React"
      description="React hooks for web-haptics. Stable callbacks, isolated instances, auto-cleanup."
      sections={sections}
      prev={{ href: "/create-haptics", label: "createHaptics()" }}
      next={{ href: "/fallbacks", label: "Fallbacks" }}
    >
      <section id="installation">
        <h2>Installation</h2>
        <p>
          The React hooks are available from a separate entry point. No extra
          packages needed.
        </p>
        <CodeBlock code={`import { useHaptics } from "web-haptics/react";`} />
      </section>

      <section id="usehaptics">
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

      <section id="usecreatehaptics">
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
    </DocsLayout>
  );
}
