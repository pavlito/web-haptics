/**
 * Audio feedback engine for web-haptics.
 *
 * Produces a soft, subtle "tik" sound similar to iOS keyboard feedback.
 * Uses a very short sine wave burst at mid-high frequency with instant
 * attack and rapid exponential decay — quiet, clean, and non-intrusive.
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

      const dur = 0.012;
      const endTime = startTime + dur;

      // Sine wave at ~1400Hz — the characteristic iOS keyboard "tik" frequency
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1395 + Math.random() * 10, startTime);

      // Soft gain envelope — quiet and gentle
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12 * level, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(endTime);
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
