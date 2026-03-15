"use client";

import { useEffect, useRef, useState } from "react";

type Block = {
  type: "pulse" | "gap";
  duration: number;
};

type PatternBarProps = {
  pattern: readonly Block[];
  playing: boolean;
};

export function PatternBar({ pattern, playing }: PatternBarProps) {
  const [playKey, setPlayKey] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (playing) {
      setPlayKey((k) => k + 1);
    }
  }, [playing]);

  const totalDuration = pattern.reduce((sum, b) => sum + b.duration, 0);
  if (totalDuration === 0) return null;

  const trackWidth = trackRef.current?.offsetWidth ?? 300;

  return (
    <div className="pattern-bar">
      <div className="pattern-bar-track" ref={trackRef}>
        {pattern.map((block, i) => {
          const widthPct = (block.duration / totalDuration) * 100;
          return (
            <div
              key={i}
              className={`pattern-bar-block pattern-bar-${block.type}`}
              style={{ width: `${widthPct}%` }}
            />
          );
        })}
        {playKey > 0 && (
          <div
            key={playKey}
            className="pattern-bar-playhead"
            style={{
              animationDuration: `${totalDuration * 8}ms`,
              ["--bar-width" as string]: `${trackWidth}px`,
            }}
          />
        )}
      </div>
      <div className="pattern-bar-labels">
        {pattern.map((block, i) => {
          const widthPct = (block.duration / totalDuration) * 100;
          return (
            <span
              key={i}
              className="pattern-bar-label"
              style={{ width: `${widthPct}%` }}
            >
              {block.duration > 10 ? `${block.duration}ms` : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}
