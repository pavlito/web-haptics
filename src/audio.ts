const CLICK_DURATION = 0.004;
const CLICK_GAIN = 0.5;
const BASE_FREQUENCY = 3000;
const FILTER_Q = 8;
const NOISE_DECAY = 25;

type AudioEngine = {
  playClick(startTime: number, intensity?: number): void;
  context: AudioContext;
};

let engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine | null {
  if (engine) return engine;

  const AC = globalThis.AudioContext ?? (globalThis as any).webkitAudioContext;
  if (!AC) return null;

  let ctx: AudioContext;
  try {
    ctx = new AC();
  } catch {
    return null;
  }

  const bufferLength = Math.ceil(CLICK_DURATION * ctx.sampleRate);

  function createNoiseBuffer(): AudioBuffer {
    const buffer = ctx.createBuffer(1, bufferLength, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferLength; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / NOISE_DECAY);
    }
    return buffer;
  }

  function playClick(startTime: number, intensity = 1): void {
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => undefined);
    }

    const level = Math.max(0, Math.min(1, intensity));
    if (level === 0) return;

    const buffer = createNoiseBuffer();
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    const jitter = 1 + (Math.random() - 0.5) * 0.3;
    filter.frequency.setValueAtTime(BASE_FREQUENCY * jitter, startTime);
    filter.Q.setValueAtTime(FILTER_Q, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(CLICK_GAIN * level, startTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(startTime);
  }

  engine = { playClick, context: ctx };
  return engine;
}

export function resetAudioEngine(): void {
  engine = null;
}
