"use client";

import { useCallback, useEffect, useRef } from "react";

type Block = {
  id: number;
  type: "pulse" | "gap";
  duration: number;
  intensity: number;
};

type DrawCanvasProps = {
  blocks: Block[];
  onDraw: (blocks: Block[]) => void;
  makeId: () => number;
};

const CANVAS_HEIGHT = 100;
const TIME_SPAN = 300;
const QUANT_STEP = 10;

function mergeBlocks(blocks: Block[], makeId: () => number): Block[] {
  if (blocks.length === 0) return [];
  const merged: Block[] = [{ ...blocks[0] }];

  for (let i = 1; i < blocks.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = blocks[i];

    if (prev.type === "gap" && curr.type === "gap") {
      prev.duration += curr.duration;
    } else if (
      prev.type === "pulse" &&
      curr.type === "pulse" &&
      Math.abs(prev.intensity - curr.intensity) < 0.15
    ) {
      prev.duration += curr.duration;
      prev.intensity = Math.round(((prev.intensity + curr.intensity) / 2) * 100) / 100;
    } else {
      merged.push({ ...curr, id: makeId() });
    }
  }

  while (merged.length > 0 && merged[merged.length - 1].type === "gap") {
    merged.pop();
  }
  while (merged.length > 0 && merged[0].type === "gap") {
    merged.shift();
  }

  return merged;
}

function quantize(
  points: { x: number; y: number }[],
  canvasWidth: number,
  makeId: () => number,
): Block[] {
  const steps = Math.ceil(TIME_SPAN / QUANT_STEP);
  const raw: Block[] = [];

  for (let i = 0; i < steps; i++) {
    const xStart = (i / steps) * canvasWidth;
    const xEnd = ((i + 1) / steps) * canvasWidth;
    const slice = points.filter((p) => p.x >= xStart && p.x < xEnd);

    if (slice.length > 0) {
      const avgY = slice.reduce((s, p) => s + p.y, 0) / slice.length;
      const intensity = Math.max(0.05, Math.min(1, 1 - avgY / CANVAS_HEIGHT));
      raw.push({
        id: makeId(),
        type: "pulse",
        duration: QUANT_STEP,
        intensity: Math.round(intensity * 100) / 100,
      });
    } else {
      raw.push({ id: makeId(), type: "gap", duration: QUANT_STEP, intensity: 1 });
    }
  }

  return mergeBlocks(raw, makeId);
}

function drawBlocks(
  ctx: CanvasRenderingContext2D,
  blocks: Block[],
  canvasWidth: number,
) {
  const totalDuration = blocks.reduce((s, b) => s + b.duration, 0);
  if (totalDuration === 0) return;

  let cursor = 0;
  for (const block of blocks) {
    const x = (cursor / totalDuration) * canvasWidth;
    const w = (block.duration / totalDuration) * canvasWidth;

    if (block.type === "pulse") {
      const h = block.intensity * CANVAS_HEIGHT;
      ctx.fillStyle = "rgba(34, 197, 94, 0.25)";
      ctx.fillRect(x, CANVAS_HEIGHT - h, w, h);
      ctx.fillStyle = "rgba(34, 197, 94, 0.6)";
      ctx.fillRect(x, CANVAS_HEIGHT - h, w, 2);
    }

    cursor += block.duration;
  }
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, CANVAS_HEIGHT);
  for (const p of points) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.lineTo(points[points.length - 1].x, CANVAS_HEIGHT);
  ctx.closePath();
  ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawGrid(ctx: CanvasRenderingContext2D, canvasWidth: number) {
  ctx.strokeStyle = "rgba(128, 128, 128, 0.15)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, CANVAS_HEIGHT / 2);
  ctx.lineTo(canvasWidth, CANVAS_HEIGHT / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(128, 128, 128, 0.4)";
  ctx.font = "10px Inter, system-ui, sans-serif";
  const step = 50;
  for (let ms = 0; ms <= TIME_SPAN; ms += step) {
    const x = (ms / TIME_SPAN) * canvasWidth;
    ctx.fillText(`${ms}`, x + 2, CANVAS_HEIGHT - 4);
  }
}

export function DrawCanvas({ blocks, onDraw, makeId }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const drawingRef = useRef(false);
  const lastXRef = useRef(-1);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    ctx.clearRect(0, 0, w, CANVAS_HEIGHT);
    drawGrid(ctx, w);

    if (drawingRef.current) {
      drawStroke(ctx, pointsRef.current);
    } else {
      drawBlocks(ctx, blocks, w);
    }
  }, [blocks]);

  useEffect(() => {
    render();
  }, [render]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      return {
        x: Math.max(0, Math.min(canvas.width, clientX - rect.left)),
        y: Math.max(0, Math.min(CANVAS_HEIGHT, clientY - rect.top)),
      };
    },
    [],
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const pos = getPos(e);
      if (!pos) return;
      drawingRef.current = true;
      pointsRef.current = [pos];
      lastXRef.current = pos.x;
      render();
    },
    [getPos, render],
  );

  const moveDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!drawingRef.current) return;
      const pos = getPos(e);
      if (!pos) return;
      if (Math.abs(pos.x - lastXRef.current) >= 2) {
        pointsRef.current.push(pos);
        lastXRef.current = pos.x;
        render();
      }
    },
    [getPos, render],
  );

  const endDraw = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas || pointsRef.current.length < 2) {
      render();
      return;
    }
    const newBlocks = quantize(pointsRef.current, canvas.width, makeId);
    pointsRef.current = [];
    onDraw(newBlocks);
  }, [onDraw, makeId, render]);

  return (
    <div className="pe-canvas-wrap">
      <div className="pe-canvas-label">
        <span>Draw a pattern</span>
        <span className="pe-canvas-hint">Drag left→right, height = intensity</span>
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={CANVAS_HEIGHT}
        className="pe-canvas"
        onMouseDown={startDraw}
        onMouseMove={moveDraw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={moveDraw}
        onTouchEnd={endDraw}
        onTouchCancel={endDraw}
      />
    </div>
  );
}
