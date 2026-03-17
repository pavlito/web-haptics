"use client";

import { useEffect, useRef, useState } from "react";

type Block = {
  type: "pulse" | "gap";
  duration: number;
  intensity?: number;
};

type PatternBarProps = {
  pattern: readonly Block[];
  playKey: number;
  scale?: number;
};

const MAX_BAR_HEIGHT = 32;
const MIN_BAR_HEIGHT = 8;
const SLOWDOWN = 3; // visual slowdown factor for readability

export function PatternBar({ pattern, playKey, scale = 1 }: PatternBarProps) {
  const [litIndices, setLitIndices] = useState<Set<number>>(new Set());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalDuration = pattern.reduce((sum, b) => sum + b.duration, 0);

  useEffect(() => {
    if (playKey === 0) return;

    // Clear previous animation
    for (const id of timersRef.current) clearTimeout(id);
    timersRef.current = [];
    setLitIndices(new Set());

    // Schedule each pulse to light up at its actual start time (× SLOWDOWN)
    let cursor = 0;
    const newTimers: ReturnType<typeof setTimeout>[] = [];

    pattern.forEach((block, i) => {
      if (block.type === "pulse") {
        const onDelay = cursor * SLOWDOWN;
        const offDelay = (cursor + block.duration) * SLOWDOWN;

        newTimers.push(
          setTimeout(() => {
            setLitIndices((prev) => new Set([...prev, i]));
          }, onDelay),
        );
        newTimers.push(
          setTimeout(() => {
            setLitIndices((prev) => {
              const next = new Set(prev);
              next.delete(i);
              return next;
            });
          }, offDelay),
        );
      }
      cursor += block.duration;
    });

    timersRef.current = newTimers;

    return () => {
      for (const id of newTimers) clearTimeout(id);
    };
  }, [playKey, pattern]);

  if (totalDuration === 0) return null;

  let cursorPct = 0;
  const items: { type: string; startPct: number; widthPct: number; duration: number; intensity: number; index: number }[] = [];

  pattern.forEach((block, i) => {
    items.push({
      type: block.type,
      startPct: (cursorPct / totalDuration) * 100,
      widthPct: (block.duration / totalDuration) * 100,
      duration: block.duration,
      intensity: block.type === "pulse" ? (block.intensity ?? 1) : 0,
      index: i,
    });
    cursorPct += block.duration;
  });

  return (
    <div className="seq">
      <div className="seq-timeline" style={scale !== 1 ? { height: 56 * scale } : undefined}>
        <div className="seq-spine" />
        {items.map((item) => {
          const barHeight = item.type === "pulse"
            ? (MIN_BAR_HEIGHT + (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * item.intensity) * scale
            : 14 * scale;

          return (
            <div
              key={item.index}
              className={`seq-tick seq-tick-${item.type} ${litIndices.has(item.index) ? "seq-tick-active" : ""}`}
              style={{
                left: `${item.startPct + item.widthPct / 2}%`,
              }}
            >
              <div
                className="seq-tick-bar"
                style={item.type === "pulse" ? { height: `${barHeight}px` } : undefined}
              />
              <span className="seq-tick-label">{item.duration}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
