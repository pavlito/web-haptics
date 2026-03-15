"use client";

import { useState } from "react";

type CodeBlockProps = {
  code: string;
  filename?: string;
};

const KEYWORDS = new Set([
  "import", "from", "const", "let", "var", "function", "return",
  "export", "default", "new", "if", "else", "async", "await",
]);

function highlightCode(code: string) {
  const parts: { text: string; type: "keyword" | "string" | "comment" | "tag" | "plain" }[] = [];
  let remaining = code;

  while (remaining.length > 0) {
    const commentMatch = remaining.match(/^(\/\/.*)/);
    if (commentMatch) {
      parts.push({ text: commentMatch[1], type: "comment" });
      remaining = remaining.slice(commentMatch[1].length);
      continue;
    }

    const tagMatch = remaining.match(/^(<\/?[A-Za-z][A-Za-z0-9]*|\/?>)/);
    if (tagMatch) {
      parts.push({ text: tagMatch[0], type: "tag" });
      remaining = remaining.slice(tagMatch[0].length);
      continue;
    }

    const stringMatch = remaining.match(/^(["'])(?:(?!\1).)*\1/);
    if (stringMatch) {
      parts.push({ text: stringMatch[0], type: "string" });
      remaining = remaining.slice(stringMatch[0].length);
      continue;
    }

    const templateMatch = remaining.match(/^`[^`]*`/);
    if (templateMatch) {
      parts.push({ text: templateMatch[0], type: "string" });
      remaining = remaining.slice(templateMatch[0].length);
      continue;
    }

    const wordMatch = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      parts.push({
        text: word,
        type: KEYWORDS.has(word) ? "keyword" : "plain",
      });
      remaining = remaining.slice(word.length);
      continue;
    }

    parts.push({ text: remaining[0], type: "plain" });
    remaining = remaining.slice(1);
  }

  return parts;
}

export function CodeBlock({ code, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const parts = highlightCode(code);

  const copyButton = (
    <button
      className="copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          setCopied(false);
        }
      }}
      type="button"
      aria-label="Copy code"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="code-outer">
      <div className="code-wrapper">
        {filename && (
          <div className="code-file-label">
            <svg className="code-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {filename === "Terminal" ? (
                <><polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /></>
              ) : (
                <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" /></>
              )}
            </svg>
            <span>{filename}</span>
            {copyButton}
          </div>
        )}
        <pre className="code">
          {parts.map((part, i) => {
            if (part.type === "plain") {
              return <span key={i}>{part.text}</span>;
            }
            return (
              <span key={i} className={`hl-${part.type}`}>
                {part.text}
              </span>
            );
          })}
        </pre>
      </div>
      {!filename && copyButton}
    </div>
  );
}
