/**
 * Audio feedback engine for web-haptics.
 *
 * Synthesizes a crisp mechanical keyboard click using a short
 * square wave burst. Square waves have that hard, clicky character
 * that sine/triangle waves lack — more like a physical switch
 * snapping than an electronic tone.
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

      // Square wave — hard edges = clicky character
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(1800, startTime);

      // Very sharp envelope — instant on, instant off
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08 * level, startTime);
      gain.gain.setValueAtTime(0, startTime + 0.002);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.003);
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
