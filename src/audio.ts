/**
 * Audio feedback engine for web-haptics.
 *
 * Produces short "tap" sounds using dual-oscillator impulse synthesis:
 * - A high-frequency ping (triangle wave) for the attack transient
 * - A low-frequency thump (sine wave) for body/warmth
 * Both have rapid gain envelopes that shape them into a percussive click.
 */

const TAP_DURATION = 0.006; // 6ms — slightly longer than a pure click for body
const ATTACK_TIME = 0.001; // 1ms attack
const PING_FREQ = 4200; // Hz — high transient
const THUMP_FREQ = 150; // Hz — low body
const PING_GAIN = 0.35;
const THUMP_GAIN = 0.2;

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

      const endTime = startTime + TAP_DURATION;

      // High-frequency ping — provides the sharp attack transient
      const ping = ctx.createOscillator();
      ping.type = "triangle";
      ping.frequency.setValueAtTime(PING_FREQ + (Math.random() - 0.5) * 800, startTime);

      const pingGain = ctx.createGain();
      pingGain.gain.setValueAtTime(0, startTime);
      pingGain.gain.linearRampToValueAtTime(PING_GAIN * level, startTime + ATTACK_TIME);
      pingGain.gain.exponentialRampToValueAtTime(0.001, endTime);

      ping.connect(pingGain);
      pingGain.connect(ctx.destination);
      ping.start(startTime);
      ping.stop(endTime);

      // Low-frequency thump — provides body and weight
      const thump = ctx.createOscillator();
      thump.type = "sine";
      thump.frequency.setValueAtTime(THUMP_FREQ, startTime);

      const thumpGain = ctx.createGain();
      thumpGain.gain.setValueAtTime(THUMP_GAIN * level, startTime);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, endTime);

      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      thump.start(startTime);
      thump.stop(endTime);
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
