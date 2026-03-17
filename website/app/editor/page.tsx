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
          Design custom haptic patterns visually. Click the timeline to add
          pulses, select blocks to adjust their timing and intensity.
        </p>
      </section>
      <PatternEditor />
    </div>
  );
}
