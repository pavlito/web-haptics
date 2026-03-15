// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { triggerSafariHaptic, playSafariPattern, destroySafariHaptic } from "../src/safari-haptics";

beforeEach(() => {
  document.body.innerHTML = "";
  destroySafariHaptic();
});

describe("safari haptics", () => {
  it("injects hidden checkbox and label into DOM on first trigger", () => {
    triggerSafariHaptic();

    const checkbox = document.querySelector<HTMLInputElement>("#web-haptics-switch");
    expect(checkbox).not.toBeNull();
    expect(checkbox!.type).toBe("checkbox");
    expect(checkbox!.getAttribute("switch")).toBe("");
    expect(checkbox!.style.display).toBe("none");

    const label = document.querySelector<HTMLLabelElement>("label[for='web-haptics-switch']");
    expect(label).not.toBeNull();
    expect(label!.style.display).toBe("none");
  });

  it("reuses existing DOM elements on subsequent triggers", () => {
    triggerSafariHaptic();
    triggerSafariHaptic();

    const checkboxes = document.querySelectorAll("#web-haptics-switch");
    expect(checkboxes.length).toBe(1);
  });

  it("clicks the label to toggle the checkbox", () => {
    triggerSafariHaptic();

    const label = document.querySelector<HTMLLabelElement>("label[for='web-haptics-switch']");
    const clickSpy = vi.spyOn(label!, "click");
    triggerSafariHaptic();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("destroySafariHaptic removes DOM elements", () => {
    triggerSafariHaptic();
    destroySafariHaptic();

    expect(document.querySelector("#web-haptics-switch")).toBeNull();
  });

  it("triggerSafariHaptic is safe in SSR (no document)", () => {
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
    const pattern = [
      { type: "pulse" as const, duration: 20 },
      { type: "gap" as const, duration: 30 },
      { type: "pulse" as const, duration: 20 },
    ];

    playSafariPattern(pattern);

    const checkbox = document.querySelector<HTMLInputElement>("#web-haptics-switch");
    expect(checkbox).not.toBeNull();
  });
});
