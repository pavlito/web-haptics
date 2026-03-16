# Review Fixes Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical and important issues found in the code review.

**Architecture:** Small targeted fixes across library source, tests, and playground page.

**Tech Stack:** TypeScript, Web Audio API, Next.js 16, Vitest.

---

## Chunk 1: Critical Fixes

### Task 1: AudioContext lifecycle — add dispose() API, remove dead initializing guard

**Files:**
- Modify: `src/audio.ts`
- Modify: `src/index.ts`
- Modify: `src/runtime.ts`
- Modify: `src/types.ts`
- Create: `test/audio-lifecycle.test.ts` or add to `test/audio.test.ts`

- [ ] **Step 1: Remove `initializing` guard from audio.ts**

It's dead code — initialization is synchronous. Remove `let initializing = false`, the `if (initializing) return null` check, and the `finally { initializing = false }` block.

- [ ] **Step 2: Add public `dispose()` function**

Add to `src/runtime.ts`:
```ts
import { resetAudioEngine } from "./audio";
import { destroySafariHaptic } from "./safari-haptics";

export function dispose(): void {
  resetAudioEngine();
  destroySafariHaptic();
}
```

Add `dispose` to `HapticsApi` type in `src/types.ts`:
```ts
dispose: () => void;
```

Wire into `haptics` singleton in `src/runtime.ts`:
```ts
dispose: () => { resetAudioEngine(); destroySafariHaptic(); },
```

Export from `src/index.ts`.

- [ ] **Step 3: Add test for resetAudioEngine calling close()**

```ts
it("resetAudioEngine closes the AudioContext", async () => {
  const closeSpy = vi.fn(() => Promise.resolve());
  class CloseableContext extends FakeAudioContext {
    close = closeSpy;
  }
  vi.stubGlobal("AudioContext", CloseableContext);
  const { getAudioEngine, resetAudioEngine } = await import("../src/audio");
  getAudioEngine(); // create engine
  resetAudioEngine();
  expect(closeSpy).toHaveBeenCalled();
});
```

- [ ] **Step 4: Run tests, build, commit**

---

## Chunk 2: Important Fixes

### Task 2: Fix playground resource leaks

**Files:**
- Modify: `website/app/playground/page.tsx`

- [ ] **Step 1: Stop oscillators on deactivation**

In `SubBassPanel`, call `bassRef.current.osc.stop()` when toggling off, then null out `bassRef.current`.

In `ThereminPanel` `endTouch`, call `osc.stop()` and `bass.osc.stop()` before nulling `stateRef.current`.

- [ ] **Step 2: Fix vibrate loop extra frame after stop**

Store rAF ID and call `cancelAnimationFrame` on stop:
```ts
let rafId: number;
function loop() {
  if (stopRef.current) return;
  // ...vibrate logic...
  rafId = requestAnimationFrame(loop);
}
rafId = requestAnimationFrame(loop);
```

On stop: `cancelAnimationFrame(rafId)` + `navigator.vibrate(0)`.

- [ ] **Step 3: Remove unused `haptics` import**

Delete `import { haptics } from "web-haptics"` from playground page.

- [ ] **Step 4: Build website, commit**

### Task 3: Add runtime validation for pattern blocks

**Files:**
- Modify: `src/playback.ts`
- Add to: `test/runtime.test.ts`

- [ ] **Step 1: Add validation in playPattern**

At the top of `playPattern`, clamp durations and filter invalid blocks:
```ts
const validated = pattern.map((b) => ({
  ...b,
  duration: Math.max(0, Number.isFinite(b.duration) ? b.duration : 0),
  ...(b.type === "pulse" && b.intensity != null
    ? { intensity: Math.max(0, Math.min(1, b.intensity)) }
    : {}),
}));
```

Use `validated` instead of `pattern` in the rest of the function.

- [ ] **Step 2: Add tests for edge cases**

```ts
it("clamps negative duration to 0", () => {
  setAudioContext(true);
  const result = haptics.play([{ type: "pulse", duration: -10 }]);
  expect(result.mode).toBe("none"); // duration clamped to 0, below 5ms threshold
});

it("handles NaN duration gracefully", () => {
  setAudioContext(true);
  const result = haptics.play([{ type: "pulse", duration: NaN }]);
  expect(result.mode).toBe("none");
});
```

- [ ] **Step 3: Run tests, commit**

### Task 4: Add missing test coverage

**Files:**
- Modify: `test/runtime.test.ts`

- [ ] **Step 1: Test consecutive pulses without gap (merging)**

```ts
it("merges consecutive pulses in vibration pattern", () => {
  const vibrate = vi.fn(() => true);
  setNavigatorVibrate(vibrate);

  haptics.play([
    { type: "pulse", duration: 20 },
    { type: "pulse", duration: 30 },
  ]);

  expect(vibrate).toHaveBeenCalledWith([50]);
});
```

- [ ] **Step 2: Test iOS path error handling**

```ts
it("catches audio errors on iOS path without crashing", () => {
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  // AudioContext that throws on createBuffer
  class BrokenAudioContext extends FakeAudioContext {
    createBuffer() { throw new Error("broken"); }
  }
  setAudioContext(true);
  vi.stubGlobal("AudioContext", BrokenAudioContext);

  // Should not throw, just returns haptics mode
  const result = haptics.success();
  expect(result.mode).toBe("haptics");
});
```

- [ ] **Step 3: Run tests, commit**

### Task 5: Document iPadOS detection limitation + fix CLAUDE.md

**Files:**
- Modify: `src/capabilities.ts` (add comment)
- Modify: `CLAUDE.md` (fix return type comment)

- [ ] **Step 1: Add comment in capabilities.ts about iPadOS false positive**

```ts
// Known limitation: Mac desktops with external touchscreen or Magic Trackpad
// may report maxTouchPoints > 1, causing a false positive. This is an accepted
// tradeoff — the Safari checkbox hack silently does nothing on macOS (no Taptic Engine).
```

- [ ] **Step 2: Fix CLAUDE.md API surface comment**

Update the `// Returns:` comment to be under `haptics.play()` not `getCapabilities()`.

- [ ] **Step 3: Commit**

---

## Chunk 3: Final Verification

### Task 6: Full test + build pass

- [ ] **Step 1:** `npm test` — all pass
- [ ] **Step 2:** `npm run build` — clean
- [ ] **Step 3:** `npm run build:website` — clean
- [ ] **Step 4:** `git push origin main`
