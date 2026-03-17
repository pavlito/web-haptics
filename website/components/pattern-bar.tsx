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

export function PatternBar({ pattern, playKey, scale = 1 }: PatternBarProps) {
  const [lit, setLit] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const totalDuration = pattern.reduce((sum, b) => sum + b.duration, 0);

  useEffect(() => {
    if (playKey === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setLit(true);
    timerRef.current = setTimeout(() => setLit(false), 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playKey]);

  if (totalDuration === 0) return null;

  let cursor = 0;
  const items: { type: string; startPct: number; widthPct: number; duration: number; intensity: number; index: number }[] = [];

  pattern.forEach((block, i) => {
    items.push({
      type: block.type,
      startPct: (cursor / totalDuration) * 100,
      widthPct: (block.duration / totalDuration) * 100,
      duration: block.duration,
      intensity: block.type === "pulse" ? (block.intensity ?? 1) : 0,
      index: i,
    });
    cursor += block.duration;
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
              className={`seq-tick seq-tick-${item.type} ${lit && item.type === "pulse" ? "seq-tick-active" : ""}`}
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
