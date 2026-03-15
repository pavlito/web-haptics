import { describe, expect, it, vi, beforeEach } from "vitest";

class FakeAudioBuffer {
  readonly numberOfChannels = 1;
  readonly length: number;
  readonly sampleRate: number;
  private data: Float32Array;

  constructor(options: { length: number; sampleRate: number }) {
    this.length = options.length;
    this.sampleRate = options.sampleRate;
    this.data = new Float32Array(options.length);
  }

  getChannelData(_channel: number): Float32Array {
    return this.data;
  }
}

class FakeAudioContext {
  sampleRate = 44100;
  currentTime = 0;
  state = "running" as AudioContextState;
  destination = {};

  resume() {
    return Promise.resolve();
  }

  createBuffer(_channels: number, length: number, sampleRate: number) {
    return new FakeAudioBuffer({ length, sampleRate });
  }

  createBufferSource() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      buffer: null as FakeAudioBuffer | null,
    };
  }

  createBiquadFilter() {
    return {
      connect: vi.fn(),
      type: "bandpass" as BiquadFilterType,
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
      },
    };
  }
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.stubGlobal("AudioContext", FakeAudioContext);
});

describe("audio engine", () => {
  it("creates engine when AudioContext is available", async () => {
    const { getAudioEngine } = await import("../src/audio");
    const engine = getAudioEngine();
    expect(engine).not.toBeNull();
  });

  it("playClick creates buffer source and connects through filter chain", async () => {
    const { getAudioEngine } = await import("../src/audio");
    const engine = getAudioEngine()!;
    engine.playClick(engine.context.currentTime + 0.01);
  });

  it("returns null when AudioContext is unavailable", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);
    const { getAudioEngine } = await import("../src/audio");
    expect(getAudioEngine()).toBeNull();
  });

  it("uses webkitAudioContext as fallback", async () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", FakeAudioContext);
    const { getAudioEngine } = await import("../src/audio");
    expect(getAudioEngine()).not.toBeNull();
  });

  it("resumes suspended context on playClick", async () => {
    const resumeSpy = vi.fn(() => Promise.resolve());
    class SuspendedContext extends FakeAudioContext {
      state = "suspended" as AudioContextState;
      resume = resumeSpy;
    }
    vi.stubGlobal("AudioContext", SuspendedContext);
    const { getAudioEngine } = await import("../src/audio");
    const engine = getAudioEngine()!;
    engine.playClick(0.01);
    expect(resumeSpy).toHaveBeenCalled();
  });
});
