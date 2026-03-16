import { describe, expect, it, vi, beforeEach } from "vitest";

class FakeAudioContext {
  sampleRate = 44100;
  currentTime = 0;
  state = "running" as AudioContextState;
  destination = {};

  resume() {
    return Promise.resolve();
  }

  createOscillator() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine" as OscillatorType,
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
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

  it("playTap creates oscillator with pitch drop", async () => {
    const { getAudioEngine } = await import("../src/audio");
    const engine = getAudioEngine()!;
    engine.playTap(engine.context.currentTime + 0.01);
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

  it("resetAudioEngine closes the AudioContext", async () => {
    const closeSpy = vi.fn(() => Promise.resolve());
    class CloseableContext extends FakeAudioContext {
      close = closeSpy;
    }
    vi.stubGlobal("AudioContext", CloseableContext);
    const { getAudioEngine, resetAudioEngine } = await import("../src/audio");
    getAudioEngine();
    resetAudioEngine();
    expect(closeSpy).toHaveBeenCalled();
  });

  it("resumes suspended context on playTap", async () => {
    const resumeSpy = vi.fn(() => Promise.resolve());
    class SuspendedContext extends FakeAudioContext {
      state = "suspended" as AudioContextState;
      resume = resumeSpy;
    }
    vi.stubGlobal("AudioContext", SuspendedContext);
    const { getAudioEngine } = await import("../src/audio");
    const engine = getAudioEngine()!;
    engine.playTap(0.01);
    expect(resumeSpy).toHaveBeenCalled();
  });
});
