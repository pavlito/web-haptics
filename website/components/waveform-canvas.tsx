"use client";

import { useCallback, useEffect, useRef } from "react";

type Block = {
  type: "pulse" | "gap";
  duration: number;
  intensity?: number;
};

type WaveformCanvasProps = {
  pattern: readonly Block[];
  playing: boolean;
};

const HEIGHT = 160;
const WIDTH = 640;

export function WaveformCanvas({ pattern, playing }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const totalDuration = pattern.reduce((s, b) => s + b.duration, 0);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => {
      // Dark background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);

      const midY = h / 2;

      // Subtle grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let y = 20; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Center line
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw waveform for each block
      let cursor = 0;
      for (const block of pattern) {
        const xStart = (cursor / totalDuration) * w;
        const blockW = (block.duration / totalDuration) * w;

        if (block.type === "pulse") {
          const intensity = block.intensity ?? 1;
          const spikeH = intensity * (h * 0.38);
          const steps = Math.max(6, Math.floor(blockW / 3));

          for (let i = 0; i < steps; i++) {
            const x = xStart + (i / steps) * blockW;
            const xPct = x / w;
            const isLit = progress > 0 && xPct <= progress;

            const phase = (i / steps) * Math.PI * 6;
            const yOff = Math.sin(phase) * spikeH;

            // Upper spike
            ctx.beginPath();
            ctx.moveTo(x, midY);
            ctx.lineTo(x, midY - yOff);
            ctx.strokeStyle = isLit ? "#22c55e" : "rgba(255,255,255,0.18)";
            ctx.lineWidth = isLit ? 2.5 : 1.5;
            ctx.stroke();

            // Lit glow per line
            if (isLit) {
              ctx.beginPath();
              ctx.moveTo(x, midY);
              ctx.lineTo(x, midY - yOff);
              ctx.strokeStyle = "rgba(34,197,94,0.3)";
              ctx.lineWidth = 6;
              ctx.stroke();
            }

            // Lower mirror
            ctx.beginPath();
            ctx.moveTo(x, midY);
            ctx.lineTo(x, midY + yOff * 0.5);
            ctx.strokeStyle = isLit ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)";
            ctx.lineWidth = isLit ? 2 : 1;
            ctx.stroke();
          }
        } else {
          // Gap — draw faint noise
          const steps = Math.max(2, Math.floor(blockW / 8));
          for (let i = 0; i < steps; i++) {
            const x = xStart + (i / steps) * blockW;
            const tiny = 2 + Math.random() * 3;
            ctx.beginPath();
            ctx.moveTo(x, midY - tiny);
            ctx.lineTo(x, midY + tiny);
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        cursor += block.duration;
      }

      // Playhead sweep
      if (progress > 0 && progress < 1) {
        const px = progress * w;

        // Glow trail
        const grad = ctx.createLinearGradient(px - 40, 0, px, 0);
        grad.addColorStop(0, "rgba(34,197,94,0)");
        grad.addColorStop(1, "rgba(34,197,94,0.12)");
        ctx.fillStyle = grad;
        ctx.fillRect(px - 40, 0, 40, h);

        // Playhead line
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Point glow
        const radGrad = ctx.createRadialGradient(px, midY, 0, px, midY, 24);
        radGrad.addColorStop(0, "rgba(34,197,94,0.5)");
        radGrad.addColorStop(1, "rgba(34,197,94,0)");
        ctx.fillStyle = radGrad;
        ctx.fillRect(px - 24, midY - 24, 48, 48);
      }
    },
    [pattern, totalDuration],
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    const elapsed = performance.now() - startRef.current;
    const animDuration = totalDuration + 200;
    const progress = Math.min(1, elapsed / animDuration);

    ctx.save();
    ctx.scale(dpr, dpr);
    draw(ctx, w, h, progress);
    ctx.restore();

    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      // After animation: redraw as fully lit
      ctx.save();
      ctx.scale(dpr, dpr);
      draw(ctx, w, h, 1);
      ctx.restore();
    }
  }, [draw, totalDuration]);

  // Setup canvas with DPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    draw(ctx, WIDTH, HEIGHT, 0);
    ctx.restore();
  }, [draw]);

  // Trigger animation on play
  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="waveform-canvas"
      style={{ width: WIDTH, height: HEIGHT }}
    />
  );
}
