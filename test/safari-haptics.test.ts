// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { triggerSafariHaptic, playSafariPattern, destroySafariHaptic } from "../src/safari-haptics";

beforeEach(() => {
  document.head.innerHTML = "";
  destroySafariHaptic();
});

describe("safari haptics", () => {
  it("creates and removes a label+checkbox from DOM on each trigger", () => {
    // Spy on appendChild/removeChild to verify create-click-remove cycle
    const appendSpy = vi.spyOn(document.head, "appendChild");
    const removeSpy = vi.spyOn(document.head, "removeChild");

    triggerSafariHaptic();

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);

    const appended = appendSpy.mock.calls[0][0] as HTMLLabelElement;
    expect(appended.tagName).toBe("LABEL");
    expect(appended.style.display).toBe("none");

    const input = appended.querySelector("input");
    expect(input).not.toBeNull();
    expect(input!.type).toBe("checkbox");
    expect(input!.getAttribute("switch")).toBe("");

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("leaves no elements in DOM after trigger", () => {
    triggerSafariHaptic();
    triggerSafariHaptic();

    // Elements are created and immediately removed — nothing should remain
    expect(document.head.querySelectorAll("label").length).toBe(0);
    expect(document.head.querySelectorAll("input").length).toBe(0);
  });

  it("is safe in SSR (no document)", () => {
    const origDoc = globalThis.document;
    try {
      // @ts-expect-error -- simulating SSR
      delete globalThis.document;
      expect(() => triggerSafariHaptic()).not.toThrow();
    } finally {
      globalThis.document = origDoc;
    }
  });
});

describe("playSafariPattern", () => {
  it("fires first click synchronously for user gesture context", () => {
    const appendSpy = vi.spyOn(document.head, "appendChild");

    playSafariPattern([
      { type: "pulse" as const, duration: 20 },
      { type: "gap" as const, duration: 30 },
      { type: "pulse" as const, duration: 20 },
    ]);

    // First click fires synchronously
    expect(appendSpy).toHaveBeenCalledTimes(1);
    appendSpy.mockRestore();
  });

  it("skips gap-only patterns", () => {
    const appendSpy = vi.spyOn(document.head, "appendChild");

    playSafariPattern([{ type: "gap" as const, duration: 50 }]);

    expect(appendSpy).not.toHaveBeenCalled();
    appendSpy.mockRestore();
  });

  it("cleans up pending timers on rapid re-trigger", () => {
    const pattern = [
      { type: "pulse" as const, duration: 20 },
      { type: "gap" as const, duration: 30 },
      { type: "pulse" as const, duration: 20 },
    ];

    // Trigger twice rapidly — should not accumulate timers
    playSafariPattern(pattern);
    playSafariPattern(pattern);

    destroySafariHaptic(); // clears timers
  });
});
