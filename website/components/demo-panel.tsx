"use client";

import { useState, useRef } from "react";
import type { PlaybackMode } from "bzzz";
import { haptics } from "bzzz";

const patterns = [
  { name: "selection", label: "Selection", action: () => haptics.selection() },
  { name: "success", label: "Success", action: () => haptics.success() },
  { name: "error", label: "Error", action: () => haptics.error() },
  { name: "toggle", label: "Toggle", action: () => haptics.toggle() },
  { name: "snap", label: "Snap", action: () => haptics.snap() },
];

const codeMap: Record<string, string> = {
  selection: "haptics.selection()",
  success: "haptics.success()",
  error: "haptics.error()",
  toggle: "haptics.toggle()",
  snap: "haptics.snap()",
};

type Toast = {
  id: number;
  pattern: string;
  mode: PlaybackMode;
};

let toastId = 0;

export function DemoPanel() {
  const [active, setActive] = useState("success");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [animating, setAnimating] = useState<string | null>(null);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  function trigger(name: string, action: () => { mode: PlaybackMode }) {
    const result = action();
    setActive(name);

    // Restart animation (clear + rAF to force reflow between removal and addition)
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    setAnimating(null);
    requestAnimationFrame(() => {
      setAnimating(name);
      animTimeoutRef.current = setTimeout(() => setAnimating(null), 400);
    });

    const id = ++toastId;
    setToasts((prev) => [...prev, { id, pattern: name, mode: result.mode }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2000);
  }

  return (
    <section>
      <h2>Types</h2>
      <p>Five built-in patterns for common interaction feedback.</p>
      <div className="buttons">
        {patterns.map((p) => (
          <button
            key={p.name}
            type="button"
            className={`btn ${active === p.name ? "btn-active" : ""} ${animating === p.name ? `btn-anim-${p.name}` : ""}`}
            onClick={() => trigger(p.name, p.action)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="demo-area">
        <div className="demo-code">
          <pre className="code">{codeMap[active]}</pre>
        </div>
        <div className="demo-toasts">
          {toasts.map((t) => (
            <div key={t.id} className={`demo-toast demo-toast-${t.mode}`}>
              <span className="demo-toast-pattern">{t.pattern}</span>
              <span className="demo-toast-mode">{t.mode}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
