/**
 * Audio feedback engine for web-haptics.
 *
 * Synthesizes a keyboard-click sound using two layered components:
 * 1. A short high-pitched "tick" (triangle wave ~1200Hz, 3ms)
 *    that drops in pitch — provides the initial click transient
 * 2. A brief low "body" tone (sine wave ~350Hz, 6ms)
 *    with softer gain — adds warmth so it doesn't sound thin
 *
 * The result is a clean, tactile "tik" reminiscent of
 * a physical keyboard key being pressed.
 */

type AudioEngine = {
  playTap(startTime: number, intensity?: number): void;
  context: AudioContext;
};

let engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine | null {
  if (engine) return engine;

  try {
    const AC = globalThis.AudioContext ?? (globalThis as any).webkitAudioContext;
    if (!AC) return null;

    const ctx: AudioContext = new AC();

    function playTap(startTime: number, intensity = 1): void {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => undefined);
      }

      const level = Math.max(0, Math.min(1, intensity));
      if (level === 0) return;

      // Layer 1: High "tick" — short triangle wave with pitch drop
      const tick = ctx.createOscillator();
      tick.type = "triangle";
      tick.frequency.setValueAtTime(1200 + Math.random() * 100, startTime);
      tick.frequency.exponentialRampToValueAtTime(600, startTime + 0.003);

      const tickGain = ctx.createGain();
      tickGain.gain.setValueAtTime(0.15 * level, startTime);
      tickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.003);

      tick.connect(tickGain);
      tickGain.connect(ctx.destination);
      tick.start(startTime);
      tick.stop(startTime + 0.004);

      // Layer 2: Low "body" — soft sine for warmth
      const body = ctx.createOscillator();
      body.type = "sine";
      body.frequency.setValueAtTime(350, startTime);

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(0.08 * level, startTime);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.006);

      body.connect(bodyGain);
      bodyGain.connect(ctx.destination);
      body.start(startTime);
      body.stop(startTime + 0.007);
    }

    engine = { playTap, context: ctx };
    return engine;
  } catch {
    return null;
  }
}

export function resetAudioEngine(): void {
  if (engine) {
    try { engine.context.close().catch(() => {}); } catch {}
  }
  engine = null;
}
