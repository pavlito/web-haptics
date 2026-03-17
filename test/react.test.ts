import { describe, expect, it, vi, beforeEach } from "vitest";
import { resetAudioEngine } from "../src/audio";
import { destroySafariHaptic } from "../src/safari-haptics";

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  resetAudioEngine();
  destroySafariHaptic();
});

describe("react entry point", () => {
  it("exports useHaptics and useCreateHaptics", async () => {
    const mod = await import("../src/react");
    expect(typeof mod.useHaptics).toBe("function");
    expect(typeof mod.useCreateHaptics).toBe("function");
  });

  it("useHaptics returns the expected API shape", async () => {
    const { useHaptics } = await import("../src/react");
    const api = useHaptics();
    expect(typeof api.selection).toBe("function");
    expect(typeof api.success).toBe("function");
    expect(typeof api.error).toBe("function");
    expect(typeof api.toggle).toBe("function");
    expect(typeof api.snap).toBe("function");
    expect(typeof api.play).toBe("function");
    expect(typeof api.isEnabled).toBe("function");
    expect(typeof api.setEnabled).toBe("function");
  });

  it("useHaptics returns stable references to singleton methods", async () => {
    const { useHaptics } = await import("../src/react");
    const { haptics } = await import("../src/index");
    const api = useHaptics();
    expect(api.selection).toBe(haptics.selection);
    expect(api.success).toBe(haptics.success);
    expect(api.setEnabled).toBe(haptics.setEnabled);
  });
});
