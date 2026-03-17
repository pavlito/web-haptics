"use client";

import { useCallback, useState } from "react";
import { defaultPatterns, haptics } from "web-haptics";
import type { PatternBlock } from "web-haptics";
import { PatternBar } from "./pattern-bar";
import { DrawCanvas } from "./draw-canvas";

type Block = {
  id: number;
  type: "pulse" | "gap";
  duration: number;
  intensity: number;
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

function patternToBlocks(pattern: readonly PatternBlock[]): Block[] {
  return pattern.map((b) => ({
    id: makeId(),
    type: b.type,
    duration: b.duration,
    intensity: b.type === "pulse" ? (b.intensity ?? 1) : 1,
  }));
}

function blocksToPattern(blocks: Block[]): PatternBlock[] {
  return blocks.map((b): PatternBlock =>
    b.type === "pulse"
      ? { type: "pulse", duration: b.duration, intensity: b.intensity }
      : { type: "gap", duration: b.duration }
  );
}

function patternToCode(blocks: Block[]): string {
  const lines = blocks.map((b) => {
    if (b.type === "gap") {
      return `  { type: "gap", duration: ${b.duration} }`;
    }
    const intensity = b.intensity !== 1
      ? `, intensity: ${Math.round(b.intensity * 100) / 100}`
      : "";
    return `  { type: "pulse", duration: ${b.duration}${intensity} }`;
  });
  return `[\n${lines.join(",\n")}\n]`;
}

export function PatternEditor() {
  const [blocks, setBlocks] = useState<Block[]>(
    () => patternToBlocks(defaultPatterns.success),
  );
  const [activePreset, setActivePreset] = useState<string>("success");
  const [copied, setCopied] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  const totalDuration = blocks.reduce((sum, b) => sum + b.duration, 0);

  const loadPreset = useCallback((name: string) => {
    const pattern = defaultPatterns[name as keyof typeof defaultPatterns];
    if (pattern) {
      setBlocks(patternToBlocks(pattern));
      setActivePreset(name);
    }
  }, []);

  const updateBlock = useCallback((id: number, updates: Partial<Block>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
    setActivePreset("");
  }, []);

  const removeBlock = useCallback((id: number) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setActivePreset("");
  }, []);

  const addBlock = useCallback((type: "pulse" | "gap") => {
    const block: Block = {
      id: makeId(),
      type,
      duration: 20,
      intensity: 1,
    };
    setBlocks((prev) => [...prev, block]);
    setActivePreset("");
  }, []);

  const toggleType = useCallback((id: number) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, type: b.type === "pulse" ? "gap" : "pulse" }
          : b,
      ),
    );
    setActivePreset("");
  }, []);

  const play = useCallback(() => {
    const pattern = blocksToPattern(blocks);
    haptics.play(pattern);
    setPlayKey((k) => k + 1);
  }, [blocks]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(patternToCode(blocks));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [blocks]);

  const handleDraw = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    setActivePreset("");
  }, []);

  return (
    <div className="pe">
      {/* Presets */}
      <div className="pe-presets">
        <span className="pe-presets-label">Presets</span>
        <div className="pe-presets-buttons">
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
      </div>

      {/* Draw canvas */}
      <DrawCanvas blocks={blocks} onDraw={handleDraw} makeId={makeId} />

      {/* Block list */}
      <div className="pe-blocks">
        {blocks.map((block) => (
          <div key={block.id} className="pe-block">
            <button
              type="button"
              className={`pe-type pe-type-${block.type}`}
              onClick={() => toggleType(block.id)}
              title="Click to toggle pulse/gap"
            >
              {block.type}
            </button>

            <label className="pe-duration">
              <input
                type="number"
                min={1}
                max={500}
                value={block.duration}
                onChange={(e) =>
                  updateBlock(block.id, {
                    duration: Math.max(1, Number(e.target.value) || 1),
                  })
                }
              />
              <span>ms</span>
            </label>

            {block.type === "pulse" && (
              <label className="pe-intensity">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(block.intensity * 100)}
                  onChange={(e) =>
                    updateBlock(block.id, {
                      intensity: Number(e.target.value) / 100,
                    })
                  }
                />
                <span>{Math.round(block.intensity * 100)}%</span>
              </label>
            )}

            <button
              type="button"
              className="pe-remove"
              onClick={() => removeBlock(block.id)}
              aria-label="Remove block"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="pe-add">
        <button type="button" className="btn" onClick={() => addBlock("pulse")}>
          + Pulse
        </button>
        <button type="button" className="btn" onClick={() => addBlock("gap")}>
          + Gap
        </button>
      </div>

      {/* Pattern visualization */}
      {blocks.length > 0 && (
        <PatternBar pattern={blocksToPattern(blocks)} playKey={playKey} />
      )}

      {/* Actions */}
      <div className="pe-actions">
        <button
          type="button"
          className="btn btn-active"
          onClick={play}
          disabled={blocks.length === 0}
        >
          ▶ Play
        </button>
        <button
          type="button"
          className="btn"
          onClick={copyCode}
          disabled={blocks.length === 0}
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
        <span className="pe-total">{totalDuration}ms</span>
      </div>

      {/* Code preview */}
      {blocks.length > 0 && (
        <div className="pe-code">
          <pre><code>{patternToCode(blocks)}</code></pre>
        </div>
      )}
    </div>
  );
}
