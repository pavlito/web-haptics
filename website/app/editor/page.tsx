import { PatternEditor } from "../../components/pattern-editor";

export const metadata = {
  title: "Pattern Editor — web-haptics",
};

export default function EditorPage() {
  return (
    <div className="container content">
      <section>
        <h1>Pattern Editor</h1>
        <p>
          Build custom haptic patterns. Start from a preset, tweak the
          blocks, preview and copy the code.
        </p>
      </section>
      <PatternEditor />
    </div>
  );
}
