"use client";

import { useCallback, useRef, useState } from "react";
import { defaultPatterns, haptics } from "web-haptics";
import type { PatternBlock } from "web-haptics";
import { CodeBlock } from "./code-block";

type Pulse = {
  id: number;
  position: number;  // ms from start
  duration: number;  // ms
  intensity: number; // 0-1
};

let nextId = Date.now();
function makeId() { return nextId++; }

const presets = [
  { name: "selection", label: "Selection" },
  { name: "success", label: "Success" },
  { name: "error", label: "Error" },
  { name: "toggle", label: "Toggle" },
  { name: "snap", label: "Snap" },
] as const;

function patternToPulses(pattern: readonly PatternBlock[]): Pulse[] {
  const pulses: Pulse[] = [];
  let cursor = 0;
  for (const b of pattern) {
    if (b.type === "pulse") {
      pulses.push({
        id: makeId(),
        position: cursor,
        duration: b.duration,
        intensity: b.intensity ?? 1,
      });
    }
    cursor += b.duration;
  }
  return pulses;
}

function pulsesToPattern(pulses: Pulse[]): PatternBlock[] {
  const sorted = [...pulses].sort((a, b) => a.position - b.position);
  const pattern: PatternBlock[] = [];
  let cursor = 0;

  for (const p of sorted) {
    if (p.position > cursor) {
      pattern.push({ type: "gap", duration: p.position - cursor });
    }
    pattern.push({
      type: "pulse",
      duration: p.duration,
      intensity: Math.round(p.intensity * 100) / 100,
    });
    cursor = p.position + p.duration;
  }

  return pattern;
}

function patternToCode(pulses: Pulse[]): string {
  const pattern = pulsesToPattern(pulses);
  const lines = pattern.map((b) => {
    if (b.type === "gap") {
      return `  { type: "gap", duration: ${b.duration} }`;
    }
    const intensity = b.intensity !== 1
      ? `, intensity: ${b.intensity}`
      : "";
    return `  { type: "pulse", duration: ${b.duration}${intensity} }`;
  });
  return `haptics.play([\n${lines.join(",\n")}\n]);`;
}

// Timeline constants
const TIMELINE_MS = 300;
const TIMELINE_HEIGHT = 120;
const MAX_BAR_H = 72;
const MIN_BAR_H = 12;
const BAR_WIDTH = 18;

export function PatternEditor() {
  const [pulses, setPulses] = useState<Pulse[]>(
    () => patternToPulses(defaultPatterns.success),
  );
  const [activePreset, setActivePreset] = useState<string>("success");
  const [tab, setTab] = useState<"editor" | "code">("editor");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState<{ id: number; type: "move" | "intensity" } | null>(null);
  const [playLit, setPlayLit] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const totalDuration = pulses.length > 0
    ? Math.max(TIMELINE_MS, ...pulses.map((p) => p.position + p.duration))
    : TIMELINE_MS;

  const msToX = (ms: number) => (ms / totalDuration) * 100;

  const loadPreset = useCallback((name: string) => {
    const pattern = defaultPatterns[name as keyof typeof defaultPatterns];
    if (pattern) {
      setPulses(patternToPulses(pattern));
      setActivePreset(name);
    }
  }, []);

  const getTimelineMs = useCallback(
    (clientX: number, clientY: number) => {
      const el = timelineRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const yPct = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      return {
        ms: Math.round(xPct * totalDuration),
        intensity: Math.max(0.05, 1 - yPct),
      };
    },
    [totalDuration],
  );

  // Click empty space → add pulse
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragging) return;
      // Don't add if clicking a bar
      if ((e.target as HTMLElement).closest(".pe-bar")) return;
      const pos = getTimelineMs(e.clientX, e.clientY);
      if (!pos) return;

      setPulses((prev) => [
        ...prev,
        { id: makeId(), position: pos.ms, duration: 15, intensity: pos.intensity },
      ]);
      setActivePreset("");
    },
    [dragging, getTimelineMs],
  );

  // Drag bar for intensity (vertical) or position (horizontal)
  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging({ id, type: "intensity" });

      const startY = e.clientY;
      const startX = e.clientX;
      const pulse = pulses.find((p) => p.id === id);
      if (!pulse) return;

      const startIntensity = pulse.intensity;
      const startPosition = pulse.position;

      function onMove(ev: MouseEvent) {
        const dy = startY - ev.clientY;
        const dx = ev.clientX - startX;

        // If horizontal movement dominates, move position
        if (Math.abs(dx) > Math.abs(dy) + 5) {
          const el = timelineRef.current;
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const msPerPx = totalDuration / rect.width;
          const newPos = Math.max(0, Math.round(startPosition + dx * msPerPx));
          setPulses((prev) =>
            prev.map((p) => (p.id === id ? { ...p, position: newPos } : p)),
          );
        } else {
          // Vertical = intensity
          const newIntensity = Math.max(0.05, Math.min(1, startIntensity + dy / TIMELINE_HEIGHT));
          setPulses((prev) =>
            prev.map((p) =>
              p.id === id
                ? { ...p, intensity: Math.round(newIntensity * 100) / 100 }
                : p,
            ),
          );
        }
        setActivePreset("");
      }

      function onUp() {
        setDragging(null);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pulses, totalDuration],
  );

  // Double-click to remove
  const handleBarDoubleClick = useCallback((e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setPulses((prev) => prev.filter((p) => p.id !== id));
    setActivePreset("");
  }, []);

  const play = useCallback(() => {
    haptics.play(pulsesToPattern(pulses));
    setPlayLit(true);
    setTimeout(() => setPlayLit(false), 400);
  }, [pulses]);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(patternToCode(pulses));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [pulses]);

  const patternDuration = pulses.length > 0
    ? Math.max(...pulses.map((p) => p.position + p.duration))
    : 0;

  return (
    <div className="doc-demo">
      {/* Tabs */}
      <div className="doc-demo-tabs">
        <div className="doc-demo-tabs-left">
          <button
            type="button"
            className={`doc-demo-tab ${tab === "editor" ? "doc-demo-tab-active" : ""}`}
            onClick={() => setTab("editor")}
          >
            Editor
          </button>
          <button
            type="button"
            className={`doc-demo-tab ${tab === "code" ? "doc-demo-tab-active" : ""}`}
            onClick={() => setTab("code")}
          >
            Code
          </button>
        </div>
        <button type="button" className="doc-demo-copy" onClick={copyCode}>
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>

      {tab === "editor" ? (
        <div className="pe-editor">
          {/* Presets */}
          <div className="pe-presets">
            {presets.map((p) => (
              <button
                key={p.name}
                type="button"
                className={`btn ${activePreset === p.name ? "btn-active" : ""}`}
                onClick={() => loadPreset(p.name)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Interactive timeline */}
          <div
            ref={timelineRef}
            className="pe-timeline"
            onClick={handleTimelineClick}
          >
            {/* Spine line */}
            <div className="pe-spine" />

            {/* Pulse bars */}
            {pulses.map((p) => {
              const barH = MIN_BAR_H + (MAX_BAR_H - MIN_BAR_H) * p.intensity;
              return (
                <div
                  key={p.id}
                  className={`pe-bar ${playLit ? "pe-bar-lit" : ""}`}
                  style={{
                    left: `${msToX(p.position + p.duration / 2)}%`,
                    height: `${barH}px`,
                  }}
                  onMouseDown={(e) => handleBarMouseDown(e, p.id)}
                  onDoubleClick={(e) => handleBarDoubleClick(e, p.id)}
                  title={`${p.duration}ms · ${Math.round(p.intensity * 100)}% — drag to adjust, double-click to remove`}
                >
                  <span className="pe-bar-label">{p.duration}ms</span>
                </div>
              );
            })}

            {/* Click hint */}
            {pulses.length === 0 && (
              <span className="pe-hint">Click to add pulses</span>
            )}
          </div>

          {/* Footer */}
          <div className="pe-footer">
            <button
              type="button"
              className="btn btn-active"
              onClick={play}
              disabled={pulses.length === 0}
            >
              ▶ Play
            </button>
            <span className="pe-total">{patternDuration}ms</span>
          </div>
        </div>
      ) : (
        <CodeBlock code={patternToCode(pulses)} />
      )}
    </div>
  );
}
