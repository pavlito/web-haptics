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
  const [activeIndex, setActiveIndex] = useState(-1);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const totalDuration = pattern.reduce((sum, b) => sum + b.duration, 0);

  useEffect(() => {
    if (playKey === 0) return;

    // Clear previous animation
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setActiveIndex(-1);

    const scale = 8;
    let cursor = 0;

    pattern.forEach((block, i) => {
      if (block.type === "pulse") {
        const t = setTimeout(() => setActiveIndex(i), cursor * scale);
        timeoutsRef.current.push(t);
      }
      cursor += block.duration;
    });

    const endT = setTimeout(() => setActiveIndex(-1), cursor * scale + 200);
    timeoutsRef.current.push(endT);

    return () => timeoutsRef.current.forEach(clearTimeout);
  }, [playKey, pattern]);

  if (totalDuration === 0) return null;

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
            className={`seq-tick ${activeIndex === p.index ? "seq-tick-active" : ""}`}
            style={{
              left: `${p.startPct + p.widthPct / 2}%`,
            }}
          >
            <div className="seq-tick-bar" />
            <span className="seq-tick-label">{p.duration}ms</span>
          </div>
        ))}
      </div>
      <div className="seq-markers">
        {items.map((it, i) => {
          if (it.type !== "gap") return null;
          return (
            <div
              key={i}
              className="seq-gap-marker"
              style={{
                left: `${it.startPct}%`,
                width: `${it.widthPct}%`,
              }}
            >
              <span className="seq-gap-label">{it.duration}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
