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

const TIMELINE_MS = 500;
const BLOCK_WIDTH = 20; // fixed width for all blocks (ms)
const MIN_GAP = 10;

export function PatternEditor() {
  const [pulses, setPulses] = useState<Pulse[]>(
    () => patternToPulses(defaultPatterns.success),
  );
  const [activePreset, setActivePreset] = useState<string>("success");
  const [tab, setTab] = useState<"editor" | "code">("editor");
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [playLit, setPlayLit] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fixed timeline — no dynamic rescaling so positions stay visually stable
  const totalDuration = TIMELINE_MS;

  const msToPercent = (ms: number) => (ms / totalDuration) * 100;

  const pxToMs = useCallback(
    (px: number) => {
      const el = timelineRef.current;
      if (!el) return 0;
      return (px / el.getBoundingClientRect().width) * totalDuration;
    },
    [totalDuration],
  );

  const clientXToMs = useCallback(
    (clientX: number) => {
      const el = timelineRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return Math.max(0, ((clientX - rect.left) / rect.width) * totalDuration);
    },
    [totalDuration],
  );

  const clientYToIntensity = useCallback(
    (clientY: number) => {
      const el = timelineRef.current;
      if (!el) return 1;
      const rect = el.getBoundingClientRect();
      // Bottom 20px is the label area
      const usableHeight = rect.height - 20;
      const y = clientY - rect.top;
      return Math.max(0.05, Math.min(1, 1 - y / usableHeight));
    },
    [],
  );

  const hasOverlap = useCallback(
    (pos: number, dur: number, excludeId?: number) => {
      return pulses.some((p) => {
        if (p.id === excludeId) return false;
        return pos < p.position + p.duration + MIN_GAP && pos + dur + MIN_GAP > p.position;
      });
    },
    [pulses],
  );

  const loadPreset = useCallback((name: string) => {
    const pattern = defaultPatterns[name as keyof typeof defaultPatterns];
    if (pattern) {
      setPulses(patternToPulses(pattern));
      setActivePreset(name);
    }
  }, []);

  // Click empty space → add block
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isDragging) return;
      if ((e.target as HTMLElement).closest(".pe-block")) return;

      const ms = Math.min(TIMELINE_MS - BLOCK_WIDTH, Math.round(clientXToMs(e.clientX)));
      const intensity = clientYToIntensity(e.clientY);

      if (hasOverlap(ms, BLOCK_WIDTH)) return;

      setPulses((prev) => [
        ...prev,
        { id: makeId(), position: ms, duration: BLOCK_WIDTH, intensity: Math.round(intensity * 100) / 100 },
      ]);
      setActivePreset("");
    },
    [isDragging, clientXToMs, clientYToIntensity, hasOverlap],
  );

  // Drag: move block (from center), resize (from edges), intensity (from top)
  const startDrag = useCallback(
    (e: React.MouseEvent, id: number, mode: "move" | "intensity") => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const pulse = pulses.find((p) => p.id === id);
      if (!pulse) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = pulse.position;
      const startDur = pulse.duration;
      const startIntensity = pulse.intensity;

      function onMove(ev: MouseEvent) {
        const dx = ev.clientX - startX;
        const msShift = pxToMs(dx);

        if (mode === "move") {
          const newPos = Math.max(0, Math.min(TIMELINE_MS - startDur, Math.round(startPos + msShift)));
          setPulses((prev) => {
            const others = prev.filter((p) => p.id !== id);
            const overlaps = others.some((p) =>
              newPos < p.position + p.duration + MIN_GAP && newPos + startDur + MIN_GAP > p.position,
            );
            if (overlaps) return prev;
            return prev.map((p) => (p.id === id ? { ...p, position: newPos } : p));
          });
        } else if (mode === "intensity") {
          const dy = startY - ev.clientY;
          const el = timelineRef.current;
          if (!el) return;
          const usableHeight = el.getBoundingClientRect().height - 20;
          const newInt = Math.max(0.05, Math.min(1, startIntensity + dy / usableHeight));
          setPulses((prev) =>
            prev.map((p) => (p.id === id ? { ...p, intensity: Math.round(newInt * 100) / 100 } : p)),
          );
        }

        setActivePreset("");
      }

      function onUp() {
        // Delay clearing to prevent click-add after drag
        requestAnimationFrame(() => setIsDragging(false));
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [pulses, pxToMs],
  );

  // Double-click to remove
  const handleDoubleClick = useCallback((e: React.MouseEvent, id: number) => {
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
            {/* Time markers */}
            {Array.from({ length: Math.floor(totalDuration / 50) + 1 }, (_, i) => (
              <span
                key={i}
                className="pe-time-marker"
                style={{ left: `${msToPercent(i * 50)}%` }}
              >
                {i * 50}
              </span>
            ))}

            {/* Pulse blocks */}
            {pulses.map((p) => {
              const barH = 8 + (32 - 8) * p.intensity; // 8px min, 32px max — same as PatternBar
              return (
                <div
                  key={p.id}
                  className={`pe-block ${playLit ? "pe-block-lit" : ""}`}
                  style={{
                    left: `${msToPercent(p.position + p.duration / 2)}%`,
                    height: `${barH}px`,
                  }}
                  onMouseDown={(e) => startDrag(e, p.id, "move")}
                  onDoubleClick={(e) => handleDoubleClick(e, p.id)}
                >
                  <div
                    className="pe-handle-top"
                    onMouseDown={(e) => startDrag(e, p.id, "intensity")}
                  />
                  <span className="pe-block-label">{p.duration}ms</span>
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
