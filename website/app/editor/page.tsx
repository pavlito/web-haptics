import { PatternEditor } from "../../components/pattern-editor";

export const metadata = {
  title: "Pattern Editor — bzzz",
};

export default function EditorPage() {
  return (
    <div className="container content">
      <section>
        <h1>Pattern Editor</h1>
        <p>
          Draw a pattern or start from a preset. Fine-tune the blocks,
          preview and copy the code.
        </p>
      </section>
      <PatternEditor />
    </div>
  );
}
