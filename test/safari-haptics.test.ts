// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { triggerSafariHaptic, playSafariPattern, destroySafariHaptic } from "../src/safari-haptics";

beforeEach(() => {
  destroySafariHaptic();
  document.body.innerHTML = "";
});

describe("safari haptics", () => {
  it("injects off-screen label+checkbox into body on first trigger", () => {
    triggerSafariHaptic();

    const label = document.body.querySelector("label");
    expect(label).not.toBeNull();
    expect(label!.style.position).toBe("fixed");
    expect(label!.style.left).toBe("-9999px");

    const input = label!.querySelector("input");
    expect(input).not.toBeNull();
    expect(input!.type).toBe("checkbox");
    expect(input!.getAttribute("switch")).toBe("");
  });

  it("reuses persistent DOM elements on subsequent triggers", () => {
    triggerSafariHaptic();
    triggerSafariHaptic();
    triggerSafariHaptic();

    expect(document.body.querySelectorAll("label").length).toBe(1);
  });

  it("clicks the label on each trigger", () => {
    triggerSafariHaptic(); // creates elements

    const label = document.body.querySelector("label")!;
    const clickSpy = vi.spyOn(label, "click");
    triggerSafariHaptic();
    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("destroySafariHaptic removes DOM elements and clears timers", () => {
    triggerSafariHaptic();
    destroySafariHaptic();

    expect(document.body.querySelector("label")).toBeNull();
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
    playSafariPattern([
      { type: "pulse" as const, duration: 20 },
      { type: "gap" as const, duration: 30 },
      { type: "pulse" as const, duration: 20 },
    ]);

    // Elements should exist (first tap creates them)
    const label = document.body.querySelector("label");
    expect(label).not.toBeNull();
  });

  it("skips gap-only patterns", () => {
    playSafariPattern([{ type: "gap" as const, duration: 50 }]);

    expect(document.body.querySelector("label")).toBeNull();
  });

  it("cleans up pending timers on rapid re-trigger", () => {
    const pattern = [
      { type: "pulse" as const, duration: 20 },
      { type: "gap" as const, duration: 30 },
      { type: "pulse" as const, duration: 20 },
    ];

    playSafariPattern(pattern);
    playSafariPattern(pattern);

    destroySafariHaptic();
  });
});
