import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAudioEngine } from "../src/audio";
import { createHaptics, defaultPatterns, haptics } from "../src/index";

class FakeAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  state = "running" as AudioContextState;
  destination = {};

  resume() {
    return Promise.resolve();
  }

  createBuffer(_channels: number, length: number, _sampleRate: number) {
    return {
      numberOfChannels: 1,
      length,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(length),
    };
  }

  createBufferSource() {
    return {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      buffer: null,
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
  resetAudioEngine();
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
      safari: false,
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
      safari: false,
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

describe("Safari detection", () => {
  it("detects iOS Safari without vibrate API", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    setAudioContext(true);

    const caps = haptics.getCapabilities();
    expect(caps.safari).toBe(true);
    expect(caps.haptics).toBe(false);
  });

  it("detects iPadOS Safari via platform and maxTouchPoints", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/604.1",
      platform: "MacIntel",
      maxTouchPoints: 5,
    });
    setAudioContext(true);

    const caps = haptics.getCapabilities();
    expect(caps.safari).toBe(true);
  });

  it("does not detect Safari on Android Chrome", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0",
      vibrate: vi.fn(() => true),
    });

    const caps = haptics.getCapabilities();
    expect(caps.safari).toBe(false);
  });

  it("does not detect Safari on desktop macOS Chrome", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0",
      platform: "MacIntel",
      maxTouchPoints: 0,
    });

    const caps = haptics.getCapabilities();
    expect(caps.safari).toBe(false);
  });

  it("returns safari false in SSR", () => {
    vi.stubGlobal("navigator", undefined);
    vi.stubGlobal("AudioContext", undefined);

    const caps = haptics.getCapabilities();
    expect(caps.safari).toBe(false);
  });
});
