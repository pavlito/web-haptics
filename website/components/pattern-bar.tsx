"use client";

import { useEffect, useRef, useState } from "react";

type Block = {
  type: "pulse" | "gap";
  duration: number;
};

type PatternBarProps = {
  pattern: readonly Block[];
  playKey: number;
};

export function PatternBar({ pattern, playKey }: PatternBarProps) {
  const [lit, setLit] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const totalDuration = pattern.reduce((sum, b) => sum + b.duration, 0);

  useEffect(() => {
    if (playKey === 0) return;

    // Flash all bars on — matches the instant haptic/audio feedback
    if (timerRef.current) clearTimeout(timerRef.current);
    setLit(true);
    timerRef.current = setTimeout(() => setLit(false), 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playKey]);

  if (totalDuration === 0) return null;

  // Build positions
  let cursor = 0;
  const items: { type: string; startPct: number; widthPct: number; duration: number; index: number }[] = [];

  pattern.forEach((block, i) => {
    items.push({
      type: block.type,
      startPct: (cursor / totalDuration) * 100,
      widthPct: (block.duration / totalDuration) * 100,
      duration: block.duration,
      index: i,
    });
    cursor += block.duration;
  });

  const pulses = items.filter((it) => it.type === "pulse");

  return (
    <div className="seq">
      <div className="seq-timeline">
        <div className="seq-spine" />
        {pulses.map((p) => (
          <div
            key={p.index}
            className={`seq-tick ${lit ? "seq-tick-active" : ""}`}
            style={{
              left: `${p.startPct + p.widthPct / 2}%`,
            }}
          >
            <div className="seq-tick-bar" />
            <span className="seq-tick-label">{p.duration}ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}
