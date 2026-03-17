/**
 * Audio feedback engine for bzzz.
 *
 * Produces a soft, warm click using shaped noise through a lowpass filter.
 * Similar architecture to other haptic audio engines (noise → filter → gain)
 * but with distinct character:
 * - Linear decay (not exponential) — sharper initial transient
 * - Lowpass filter (not bandpass) — warmer, fuller sound
 * - Lower Q for broader frequency response
 * - 5ms duration
 */

const CLICK_DURATION = 0.005;
const CLICK_GAIN = 0.3;
const FILTER_FREQ = 2200;
const FILTER_Q = 3;

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
    const bufferLength = Math.ceil(CLICK_DURATION * ctx.sampleRate);

    function createClickBuffer(): AudioBuffer {
      const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        // Linear decay with cubic rolloff — sharper attack than exponential,
        // faster tail than linear alone
        const t = i / data.length;
        const envelope = (1 - t) * (1 - t);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }
      return buffer;
    }

    function playTap(startTime: number, intensity = 1): void {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => undefined);
      }

      const level = Math.max(0, Math.min(1, intensity));
      if (level === 0) return;

      const buffer = createClickBuffer();
      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Lowpass filter — keeps the warm low end, cuts harsh highs
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(
        FILTER_FREQ + (Math.random() - 0.5) * 400,
        startTime,
      );
      filter.Q.setValueAtTime(FILTER_Q, startTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(CLICK_GAIN * level, startTime);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(startTime);
      source.stop(startTime + CLICK_DURATION);
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
