"use client";

import { useCallback, useRef, useState } from "react";
import type { PatternBlock } from "web-haptics";

type EditorBlock = {
  id: number;
  start: number; // ms from timeline start
  duration: number; // ms
  intensity: number; // 0-1
};

const TIMELINE_WIDTH = 560;
const TIMELINE_HEIGHT = 80;
const MIN_DURATION = 5;
const DEFAULT_DURATION = 20;
const PX_PER_MS = 2; // 2px per millisecond

function blocksToPattern(blocks: EditorBlock[]): PatternBlock[] {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const pattern: PatternBlock[] = [];

  let cursor = 0;
  for (const block of sorted) {
    if (block.start > cursor) {
      pattern.push({ type: "gap", duration: block.start - cursor });
    }
    pattern.push({
      type: "pulse",
      duration: block.duration,
      intensity: Math.round(block.intensity * 100) / 100,
    });
    cursor = block.start + block.duration;
  }

  return pattern;
}

function patternToCode(blocks: EditorBlock[]): string {
  const pattern = blocksToPattern(blocks);
  const lines = pattern.map((b) => {
    if (b.type === "gap") {
      return `  { type: "gap", duration: ${b.duration} }`;
    }
    const intensity =
      b.intensity != null && b.intensity !== 1
        ? `, intensity: ${b.intensity}`
        : "";
    return `  { type: "pulse", duration: ${b.duration}${intensity} }`;
  });
  return `[\n${lines.join(",\n")}\n]`;
}

export function PatternEditor() {
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: 1, start: 0, duration: 20, intensity: 0.6 },
    { id: 2, start: 50, duration: 30, intensity: 1.0 },
  ]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(3);
  const [copied, setCopied] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const totalDuration = blocks.reduce(
    (max, b) => Math.max(max, b.start + b.duration),
    0,
  );
  const timelineWidthPx = Math.max(
    TIMELINE_WIDTH,
    (totalDuration + 100) * PX_PER_MS,
  );

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
      const y = e.clientY - rect.top;
      const ms = Math.round(x / PX_PER_MS);
      const intensity = Math.max(0.1, Math.min(1, 1 - y / TIMELINE_HEIGHT));

      // Check if clicking on existing block
      const clickedBlock = blocks.find(
        (b) => ms >= b.start && ms <= b.start + b.duration,
      );
      if (clickedBlock) {
        setSelectedId(clickedBlock.id);
        return;
      }

      // Check overlap with new block
      const newStart = ms;
      const newEnd = ms + DEFAULT_DURATION;
      const overlaps = blocks.some(
        (b) => newStart < b.start + b.duration && newEnd > b.start,
      );
      if (overlaps) return;

      const newBlock: EditorBlock = {
        id: nextId,
        start: ms,
        duration: DEFAULT_DURATION,
        intensity: Math.round(intensity * 100) / 100,
      };
      setBlocks((prev) => [...prev, newBlock]);
      setSelectedId(nextId);
      setNextId((n) => n + 1);
    },
    [blocks, nextId],
  );

  const deleteSelected = useCallback(() => {
    if (selectedId === null) return;
    setBlocks((prev) => prev.filter((b) => b.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const updateBlock = useCallback(
    (id: number, updates: Partial<EditorBlock>) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      );
    },
    [],
  );

  const playPattern = useCallback(async () => {
    // website's package.json has "web-haptics": "file:.." so this resolves locally
    const { haptics } = await import("web-haptics");
    const pattern = blocksToPattern(blocks);
    haptics.play(pattern);
  }, [blocks]);

  const copyCode = useCallback(() => {
    const code = patternToCode(blocks);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [blocks]);

  const clearAll = useCallback(() => {
    setBlocks([]);
    setSelectedId(null);
  }, []);

  const selectedBlock = blocks.find((b) => b.id === selectedId);

  return (
    <div className="pattern-editor">
      <div className="pattern-editor-toolbar">
        <button type="button" className="btn" onClick={playPattern}>
          Play
        </button>
        <button type="button" className="btn" onClick={copyCode}>
          {copied ? "Copied!" : "Copy code"}
        </button>
        <button type="button" className="btn" onClick={clearAll}>
          Clear
        </button>
        {selectedBlock && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={deleteSelected}
          >
            Delete block
          </button>
        )}
        <span className="pattern-editor-duration">{totalDuration}ms total</span>
      </div>

      <div className="pattern-editor-timeline-wrapper" ref={timelineRef}>
        <div
          className="pattern-editor-timeline"
          style={{
            width: `${timelineWidthPx}px`,
            height: `${TIMELINE_HEIGHT}px`,
          }}
          onClick={handleTimelineClick}
        >
          {/* Time markers */}
          {Array.from(
            { length: Math.ceil(timelineWidthPx / PX_PER_MS / 50) + 1 },
            (_, i) => (
              <div
                key={i}
                className="pattern-editor-marker"
                style={{ left: `${i * 50 * PX_PER_MS}px` }}
              >
                <span>{i * 50}ms</span>
              </div>
            ),
          )}

          {/* Blocks */}
          {blocks.map((block) => (
            <div
              key={block.id}
              className={`pattern-editor-block ${
                block.id === selectedId ? "pattern-editor-block-selected" : ""
              }`}
              style={{
                left: `${block.start * PX_PER_MS}px`,
                width: `${Math.max(block.duration * PX_PER_MS, 4)}px`,
                height: `${block.intensity * 100}%`,
                bottom: 0,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(block.id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Selected block controls */}
      {selectedBlock && (
        <div className="pattern-editor-controls">
          <label>
            <span>Start: {selectedBlock.start}ms</span>
            <input
              type="range"
              min={0}
              max={500}
              value={selectedBlock.start}
              onChange={(e) =>
                updateBlock(selectedBlock.id, {
                  start: Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            <span>Duration: {selectedBlock.duration}ms</span>
            <input
              type="range"
              min={MIN_DURATION}
              max={200}
              value={selectedBlock.duration}
              onChange={(e) =>
                updateBlock(selectedBlock.id, {
                  duration: Number(e.target.value),
                })
              }
            />
          </label>
          <label>
            <span>
              Intensity: {Math.round(selectedBlock.intensity * 100)}%
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(selectedBlock.intensity * 100)}
              onChange={(e) =>
                updateBlock(selectedBlock.id, {
                  intensity: Number(e.target.value) / 100,
                })
              }
            />
          </label>
        </div>
      )}

      {/* Code preview */}
      <div className="pattern-editor-code">
        <pre>
          <code>{patternToCode(blocks)}</code>
        </pre>
      </div>
    </div>
  );
}
