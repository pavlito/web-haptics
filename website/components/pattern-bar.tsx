"use client";

import { useLayoutEffect, useRef, useState } from "react";

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
const MIN_VISIBLE_MS = 80; // minimum time a bar stays lit so humans can see it

export function PatternBar({ pattern, playKey, scale = 1 }: PatternBarProps) {
  const [litIndices, setLitIndices] = useState<Set<number>>(new Set());
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalDuration = pattern.reduce((sum, b) => sum + b.duration, 0);

  useLayoutEffect(() => {
    if (playKey === 0) return;

    // Clear previous animation
    for (const id of timersRef.current) clearTimeout(id);
    timersRef.current = [];

    // Bars light at real pattern start times (synced with haptic)
    // but stay lit for at least MIN_VISIBLE_MS so humans can perceive them
    let cursor = 0;
    const newTimers: ReturnType<typeof setTimeout>[] = [];
    const immediateIndices = new Set<number>();

    pattern.forEach((block, i) => {
      if (block.type === "pulse") {
        const onDelay = cursor;
        const offDelay = cursor + Math.max(block.duration, MIN_VISIBLE_MS);

        if (onDelay === 0) {
          immediateIndices.add(i);
        } else {
          newTimers.push(
            setTimeout(() => {
              setLitIndices((prev) => new Set([...prev, i]));
            }, onDelay),
          );
        }

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

    // First pulse lights synchronously — zero delay
    setLitIndices(immediateIndices);

    timersRef.current = newTimers;

    return () => {
      for (const id of newTimers) clearTimeout(id);
    };
  }, [playKey, pattern, totalDuration]);

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
      <div className="seq-timeline" style={scale !== 1 ? { height: 40 * scale } : undefined}>
        <div
          className="seq-spine"
          style={scale !== 1 ? { height: `${2 * scale}px` } : undefined}
        />
        {/* Playhead removed — real-time bar lighting is sufficient */}
        {items.filter((item) => item.type === "pulse").map((item) => {
          const barHeight = (MIN_BAR_HEIGHT + (MAX_BAR_HEIGHT - MIN_BAR_HEIGHT) * item.intensity) * scale;

          return (
            <div
              key={item.index}
              className={`seq-tick seq-tick-pulse ${litIndices.has(item.index) ? "seq-tick-active" : ""}`}
              style={{
                left: `${item.startPct + item.widthPct / 2}%`,
              }}
            >
              <div
                className="seq-tick-bar"
                style={{ height: `${barHeight}px` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
