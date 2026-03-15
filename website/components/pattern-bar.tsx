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
  const [activeStep, setActiveStep] = useState(-1);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!playing) return;

    // Clear previous animation
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Build timeline: cumulative ms offset for each block
    let cursor = 0;
    const steps: { index: number; time: number; type: string }[] = [];
    pattern.forEach((block, i) => {
      steps.push({ index: i, time: cursor, type: block.type });
      cursor += block.duration;
    });

    // Slow down 8x so it's visible (patterns are 48-102ms total)
    const scale = 8;

    steps.forEach((step) => {
      const t = setTimeout(() => setActiveStep(step.index), step.time * scale);
      timeoutsRef.current.push(t);
    });

    // Clear active after last step
    const endT = setTimeout(() => setActiveStep(-1), cursor * scale + 200);
    timeoutsRef.current.push(endT);

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [playing, pattern]);

  // Only render pulse blocks as steps, gaps become spacing
  const pulses = pattern
    .map((block, i) => ({ ...block, originalIndex: i }))
    .filter((b) => b.type === "pulse");

  if (pulses.length === 0) return null;

  return (
    <div className="seq">
      <div className="seq-steps">
        {pattern.map((block, i) => {
          if (block.type === "gap") {
            return (
              <div
                key={i}
                className="seq-gap"
                style={{ flex: block.duration }}
              />
            );
          }
          const isActive = activeStep === i;
          return (
            <div
              key={i}
              className={`seq-step ${isActive ? "seq-step-active" : ""}`}
              style={{ flex: block.duration }}
            >
              <div className="seq-bar" />
              <span className="seq-label">{block.duration}ms</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
