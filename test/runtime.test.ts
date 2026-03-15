import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHaptics, defaultPatterns, haptics } from "../src/index";

class FakeAudioContext {
  currentTime = 0;
  destination = {};

  resume() {
    return Promise.resolve();
  }

  createOscillator() {
    return {
      connect: vi.fn(),
      frequency: {
        setValueAtTime: vi.fn(),
      },
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine" as OscillatorType,
    };
  }

  createGain() {
    return {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };
  }
}

function setNavigatorVibrate(vibrate?: (pattern: number[]) => boolean) {
  vi.stubGlobal("navigator", vibrate ? { vibrate } : {});
}

function setAudioContext(enabled: boolean) {
  if (enabled) {
    vi.stubGlobal("AudioContext", FakeAudioContext);
  } else {
    vi.stubGlobal("AudioContext", undefined);
  }
}

beforeEach(() => {
  vi.unstubAllGlobals();
  setNavigatorVibrate(undefined);
  setAudioContext(false);
});

describe("haptics runtime", () => {
  it("uses haptics mode when vibrate succeeds", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);

    const result = haptics.success();

    expect(result.mode).toBe("haptics");
    expect(vibrate).toHaveBeenCalled();
  });

  it("falls back to audio when vibrate is unavailable", () => {
    setAudioContext(true);

    const result = haptics.success();

    expect(result.mode).toBe("audio");
  });

  it("falls back to audio when vibrate returns false", () => {
    setNavigatorVibrate(() => false);
    setAudioContext(true);

    const result = haptics.success();

    expect(result.mode).toBe("audio");
  });

  it("returns none when no output path is available", () => {
    const result = haptics.success();

    expect(result.mode).toBe("none");
  });

  it("reports capability state", () => {
    setNavigatorVibrate(() => true);
    setAudioContext(true);

    expect(haptics.getCapabilities()).toEqual({
      haptics: true,
      audio: true,
    });
  });

  it("keeps custom instance registry isolated from singleton defaults", () => {
    setNavigatorVibrate(() => true);

    const instance = createHaptics();
    instance.register("success", [{ type: "pulse", duration: 99 }]);

    instance.play("success");
    const singletonResult = haptics.success();

    expect(singletonResult.mode).toBe("haptics");
    expect(haptics.play([{ type: "pulse", duration: 12 }]).mode).toBe("haptics");
  });
});

describe("all named patterns", () => {
  it("selection returns PlaybackResult", () => {
    setAudioContext(true);
    expect(haptics.selection().mode).toBe("audio");
  });

  it("error returns PlaybackResult", () => {
    setAudioContext(true);
    expect(haptics.error().mode).toBe("audio");
  });

  it("toggle returns PlaybackResult", () => {
    setAudioContext(true);
    expect(haptics.toggle().mode).toBe("audio");
  });

  it("snap returns PlaybackResult", () => {
    setAudioContext(true);
    expect(haptics.snap().mode).toBe("audio");
  });
});

describe("error handling", () => {
  it("throws on unknown pattern name", () => {
    const instance = createHaptics();
    expect(() => instance.play("nonexistent")).toThrow(
      "Unknown haptics pattern: nonexistent",
    );
  });

  it("returns none for empty pattern", () => {
    setAudioContext(true);
    expect(haptics.play([]).mode).toBe("none");
  });

  it("returns none for gap-only pattern", () => {
    setAudioContext(true);
    expect(haptics.play([{ type: "gap", duration: 50 }]).mode).toBe("none");
  });

  it("returns none for sub-5ms pulse-only pattern in audio mode", () => {
    setAudioContext(true);
    expect(haptics.play([{ type: "pulse", duration: 3 }]).mode).toBe("none");
  });
});

describe("defaultPatterns", () => {
  it("is frozen and throws on mutation", () => {
    expect(() => {
      (defaultPatterns.selection as any)[0] = { type: "pulse", duration: 999 };
    }).toThrow();
  });

  it("block objects are frozen", () => {
    expect(() => {
      (defaultPatterns.selection[0] as any).duration = 999;
    }).toThrow();
  });
});

describe("createHaptics", () => {
  it("accepts custom initial patterns that override defaults", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);

    const instance = createHaptics({
      patterns: {
        success: [{ type: "pulse", duration: 100 }],
      },
    });

    instance.play("success");
    expect(vibrate).toHaveBeenCalledWith([100]);
  });

  it("register and play by name works", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);

    const instance = createHaptics();
    instance.register("custom", [
      { type: "pulse", duration: 50 },
      { type: "gap", duration: 20 },
      { type: "pulse", duration: 30 },
    ]);

    instance.play("custom");
    expect(vibrate).toHaveBeenCalledWith([50, 20, 30]);
  });

  it("instance getCapabilities works", () => {
    setNavigatorVibrate(() => true);
    setAudioContext(true);

    const instance = createHaptics();
    expect(instance.getCapabilities()).toEqual({
      haptics: true,
      audio: true,
    });
  });
});

describe("SSR safety", () => {
  it("returns none without navigator or AudioContext", () => {
    vi.stubGlobal("navigator", undefined);
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);

    expect(haptics.success().mode).toBe("none");
  });

  it("detects webkitAudioContext fallback", () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", FakeAudioContext);

    expect(haptics.getCapabilities().audio).toBe(true);
    expect(haptics.success().mode).toBe("audio");
  });
});

describe("vibration pattern generation", () => {
  it("filters audio blocks from vibration pattern", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);

    // Audio block between pulses is skipped — consecutive pulses merge
    haptics.play([
      { type: "pulse", duration: 20 },
      { type: "audio", duration: 100, sound: "tick" },
      { type: "pulse", duration: 30 },
    ]);

    expect(vibrate).toHaveBeenCalledWith([50]);
  });

  it("audio blocks do not appear in vibration pattern with gaps", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);

    haptics.play([
      { type: "pulse", duration: 20 },
      { type: "gap", duration: 10 },
      { type: "audio", duration: 100, sound: "tick" },
      { type: "pulse", duration: 30 },
    ]);

    // Audio block skipped, gap separates pulses, second pulse follows gap
    expect(vibrate).toHaveBeenCalledWith([20, 10, 30]);
  });

  it("merges consecutive gaps in vibration pattern", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);

    haptics.play([
      { type: "pulse", duration: 20 },
      { type: "gap", duration: 10 },
      { type: "gap", duration: 10 },
      { type: "pulse", duration: 15 },
    ]);

    expect(vibrate).toHaveBeenCalledWith([20, 20, 15]);
  });

  it("skips leading gaps", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);

    haptics.play([
      { type: "gap", duration: 50 },
      { type: "pulse", duration: 20 },
    ]);

    expect(vibrate).toHaveBeenCalledWith([20]);
  });

  it("does not vibrate for gap-only pattern", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);

    haptics.play([{ type: "gap", duration: 50 }]);

    expect(vibrate).not.toHaveBeenCalled();
  });
});

describe("dual-mode playback", () => {
  it("plays haptics and audio simultaneously when both available", () => {
    const vibrate = vi.fn(() => true);
    setNavigatorVibrate(vibrate);
    setAudioContext(true);

    const result = haptics.success();

    expect(result.mode).toBe("haptics");
    expect(vibrate).toHaveBeenCalled();
  });
});
