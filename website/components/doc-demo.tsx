"use client";

import { useState, type ReactNode } from "react";
import { CodeBlock } from "./code-block";

type DocDemoProps = {
  code: string;
  children: ReactNode;
};

export function DocDemo({ code, children }: DocDemoProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  return (
    <div className="doc-demo">
      <div className="doc-demo-tabs">
        <div className="doc-demo-tabs-left">
          <button
            type="button"
            className={`doc-demo-tab ${tab === "preview" ? "doc-demo-tab-active" : ""}`}
            onClick={() => setTab("preview")}
          >
            Preview
          </button>
          <button
            type="button"
            className={`doc-demo-tab ${tab === "code" ? "doc-demo-tab-active" : ""}`}
            onClick={() => setTab("code")}
          >
            Code
          </button>
        </div>
        <button
          type="button"
          className="doc-demo-copy"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            } catch {}
          }}
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      {tab === "preview" ? (
        <div className="doc-demo-preview">{children}</div>
      ) : (
        <CodeBlock code={code} />
      )}
    </div>
  );
}
