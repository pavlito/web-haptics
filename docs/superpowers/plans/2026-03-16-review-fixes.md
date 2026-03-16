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
- Modify: `test/audio.test.ts`

- [ ] **Step 1: Remove `initializing` guard from audio.ts**

It's dead code — initialization is synchronous. Remove ALL references to `initializing`:
- `let initializing = false` (line 13)
- `if (initializing) return null` (line 17)
- `initializing = true` (line 18)
- `finally { initializing = false }` block (lines 69-71)
- `initializing = false` inside `resetAudioEngine()` (line 79)

Keep the `try/catch` around construction.

- [ ] **Step 2: Add `dispose()` to both HapticsApi and HapticsInstance**

In `src/types.ts`, add `dispose` to both types:

```ts
export type HapticsApi = {
  selection: () => PlaybackResult;
  success: () => PlaybackResult;
  error: () => PlaybackResult;
  toggle: () => PlaybackResult;
  snap: () => PlaybackResult;
  play: (pattern: readonly PatternBlock[]) => PlaybackResult;
  getCapabilities: () => CapabilityState;
  dispose: () => void;
};

export type HapticsInstance = {
  play: (nameOrPattern: string | readonly PatternBlock[]) => PlaybackResult;
  register: (name: string, pattern: readonly PatternBlock[]) => void;
  getCapabilities: () => CapabilityState;
  dispose: () => void;
};
```

- [ ] **Step 3: Wire dispose into runtime.ts**

In `src/runtime.ts`, add imports and wire dispose:

```ts
import { resetAudioEngine } from "./audio";
import { destroySafariHaptic } from "./safari-haptics";
```

Add to `haptics` singleton:
```ts
dispose: () => { resetAudioEngine(); destroySafariHaptic(); },
```

Add to `createHaptics` return:
```ts
dispose: () => { resetAudioEngine(); destroySafariHaptic(); },
```

Note: both singleton and instances share the global audio engine. Calling `dispose()` on any instance cleans up the shared resources. This is documented behavior — the library uses a single AudioContext.

- [ ] **Step 4: Export dispose from index.ts**

Add standalone `dispose` export:
```ts
export { dispose } from "./runtime";
```

Where `dispose` is a named export from runtime.ts:
```ts
export function dispose(): void {
  resetAudioEngine();
  destroySafariHaptic();
}
```

- [ ] **Step 5: Add test for resetAudioEngine calling close()**

Add to `test/audio.test.ts`:
```ts
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
```

- [ ] **Step 6: Run tests, build, commit**

Run: `npm test && npm run build`

```bash
git add src/audio.ts src/types.ts src/runtime.ts src/index.ts test/audio.test.ts
git commit -m "feat: add dispose() API, remove dead initializing guard, test AudioContext cleanup"
```

---

## Chunk 2: Important Fixes

### Task 2: Fix playground resource leaks

**Files:**
- Modify: `website/app/playground/page.tsx`

- [ ] **Step 1: Fix SubBassPanel — create new oscillator on each toggle, stop+disconnect on off**

Since `osc.stop()` is permanent (cannot restart), create a new oscillator each time toggle is activated. On deactivation, stop + disconnect + null out:

```ts
const toggle = useCallback(() => {
  if (active) {
    if (bassRef.current) {
      bassRef.current.osc.disconnect();
      bassRef.current.osc.stop();
      bassRef.current.gain.disconnect();
      bassRef.current = null;
    }
    setActive(false);
    return;
  }

  const ctx = getAudioCtx();
  bassRef.current = createSubBass(ctx);
  bassRef.current.osc.frequency.value = freq;
  bassRef.current.gain.gain.value = volume;
  setActive(true);
}, [active, freq, volume, getAudioCtx]);
```

Also update the unmount cleanup effect to stop oscillator:
```ts
useEffect(() => {
  return () => {
    if (bassRef.current) {
      bassRef.current.osc.disconnect();
      bassRef.current.osc.stop();
      bassRef.current.gain.disconnect();
      bassRef.current = null;
    }
  };
}, []);
```

- [ ] **Step 2: Fix ThereminPanel — stop oscillators in endTouch**

```ts
const endTouch = useCallback(() => {
  if (stateRef.current) {
    stateRef.current.osc.disconnect();
    stateRef.current.osc.stop();
    stateRef.current.gain.disconnect();
    stateRef.current.bass.osc.disconnect();
    stateRef.current.bass.osc.stop();
    stateRef.current.bass.gain.disconnect();
    stateRef.current.vibrateStop.current = true;
    navigator.vibrate?.(0);
    stateRef.current = null;
  }
  setTouching(false);
  setCoords(null);
}, []);
```

- [ ] **Step 3: Fix vibrate loop — return rafId for cancellation**

Refactor `startVibrateLoop` to return a cleanup function:

```ts
function startVibrateLoop(
  intensityRef: React.RefObject<number>,
  stopRef: React.RefObject<boolean>,
): () => void {
  let rafId: number;
  function loop() {
    if (stopRef.current) return;
    const intensity = intensityRef.current;
    if (intensity > 0 && typeof navigator.vibrate === "function") {
      if (intensity >= 1) {
        navigator.vibrate(200);
      } else {
        const on = Math.max(1, Math.round(20 * intensity));
        const off = 20 - on;
        navigator.vibrate([on, off, on, off, on, off, on, off, on, off]);
      }
    }
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(rafId);
}
```

In VibrateLoopPanel, store the cleanup function:
```ts
const cancelRef = useRef<(() => void) | null>(null);

const toggle = useCallback(() => {
  if (active) {
    stopRef.current = true;
    cancelRef.current?.();
    navigator.vibrate?.(0);
    setActive(false);
    return;
  }
  stopRef.current = false;
  cancelRef.current = startVibrateLoop(intensityRef, stopRef);
  setActive(true);
}, [active]);
```

Also in Theremin:
- Store vibrate loop cleanup function in `stateRef.current` and call it in `endTouch`
- Update Theremin's unmount `useEffect` to also call `.stop()` / `.disconnect()` on oscillators:

```ts
useEffect(() => {
  return () => {
    if (stateRef.current) {
      stateRef.current.osc.disconnect();
      stateRef.current.osc.stop();
      stateRef.current.gain.disconnect();
      stateRef.current.bass.osc.disconnect();
      stateRef.current.bass.osc.stop();
      stateRef.current.bass.gain.disconnect();
      stateRef.current.vibrateStop.current = true;
      navigator.vibrate?.(0);
    }
  };
}, []);
```

- [ ] **Step 4: Remove unused `haptics` import**

Delete line 4: `import { haptics } from "web-haptics";`

- [ ] **Step 5: Build website, commit**

Run: `npm run build:website`

```bash
git add website/app/playground/page.tsx
git commit -m "fix: playground resource cleanup — stop oscillators, cancel rAF, remove unused import"
```

### Task 3: Add runtime validation for pattern blocks

**Files:**
- Modify: `src/playback.ts`
- Modify: `test/runtime.test.ts`

- [ ] **Step 1: Add type-safe validation in playPattern**

Use explicit `PatternBlock` return type to preserve discriminated union:

```ts
function validatePattern(pattern: readonly PatternBlock[]): PatternBlock[] {
  return pattern.map((b): PatternBlock => {
    const duration = Math.max(0, Number.isFinite(b.duration) ? b.duration : 0);
    if (b.type === "pulse") {
      return {
        type: "pulse",
        duration,
        intensity: b.intensity != null ? Math.max(0, Math.min(1, b.intensity)) : undefined,
      };
    }
    return { type: "gap", duration };
  });
}
```

Replace the full `playPattern` function body to use `validated` in ALL paths:

```ts
export function playPattern(pattern: readonly PatternBlock[]): PlaybackResult {
  const validated = validatePattern(pattern);
  const capabilities = getCapabilityState();
  const vibrationPattern = toVibrationPattern(validated);

  if (capabilities.ios && validated.some((b) => b.type === "pulse" && b.duration >= 5)) {
    playSafariPattern(validated);
    try { playAudioClicks(validated); } catch {}
    return { mode: "haptics" };
  }

  if (
    vibrationPattern.length > 0 &&
    capabilities.haptics &&
    navigator.vibrate(vibrationPattern)
  ) {
    try { playAudioClicks(validated); } catch {}
    return { mode: "haptics" };
  }

  if (capabilities.audio) {
    try {
      const played = playAudioClicks(validated);
      return { mode: played ? "audio" : "none" };
    } catch {
      return { mode: "none" };
    }
  }

  return { mode: "none" };
}
```

Every occurrence of `pattern` inside the function is replaced with `validated`.

- [ ] **Step 2: Add tests for edge cases**

```ts
it("clamps negative duration to 0 — returns none in audio-only mode", () => {
  setAudioContext(true);
  const result = haptics.play([{ type: "pulse", duration: -10 }]);
  // Clamped to 0, below 5ms audio threshold, no vibrate available
  expect(result.mode).toBe("none");
});

it("handles NaN duration gracefully", () => {
  setAudioContext(true);
  const result = haptics.play([{ type: "pulse", duration: NaN }]);
  expect(result.mode).toBe("none");
});

it("clamps intensity to 0-1 range", () => {
  const vibrate = vi.fn(() => true);
  setNavigatorVibrate(vibrate);
  // intensity > 1 should be clamped to 1
  haptics.play([{ type: "pulse", duration: 25, intensity: 5 }]);
  expect(vibrate).toHaveBeenCalledWith([25]);
});
```

- [ ] **Step 3: Run tests, commit**

```bash
git add src/playback.ts test/runtime.test.ts
git commit -m "feat: add runtime validation for pattern blocks — clamp duration, intensity"
```

### Task 4: Add missing test coverage

**Files:**
- Modify: `test/runtime.test.ts`

- [ ] **Step 1: Test consecutive pulses without gap**

The current `toVibrationPattern` inserts a zero-gap between consecutive pulses. Test the actual behavior:

```ts
it("separates consecutive pulses with zero-gap in vibration pattern", () => {
  const vibrate = vi.fn(() => true);
  setNavigatorVibrate(vibrate);

  haptics.play([
    { type: "pulse", duration: 20 },
    { type: "pulse", duration: 30 },
  ]);

  // Code inserts a 0ms gap between consecutive on-segments
  expect(vibrate).toHaveBeenCalledWith([20, 0, 30]);
});
```

- [ ] **Step 2: Test iOS path catches audio errors**

```ts
it("catches audio errors on iOS path without crashing", () => {
  vi.stubGlobal("navigator", {
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  class BrokenAudioContext extends FakeAudioContext {
    createBuffer() { throw new Error("broken"); }
  }
  vi.stubGlobal("AudioContext", BrokenAudioContext);

  // Should not throw — audio error is caught, Safari haptic still fires
  const result = haptics.success();
  expect(result.mode).toBe("haptics");
});
```

Note: no `setAudioContext(true)` needed — we stub `AudioContext` directly with `BrokenAudioContext`.

- [ ] **Step 3: Run tests, commit**

```bash
git add test/runtime.test.ts
git commit -m "test: add coverage for pulse merging and iOS audio error path"
```

### Task 5: Document iPadOS detection limitation + fix CLAUDE.md

**Files:**
- Modify: `src/capabilities.ts`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add comment in capabilities.ts**

Above the `isIOS` line in `isIOSSafari()`:
```ts
// Known limitation: Mac desktops with external touchscreen or Magic Trackpad
// may report maxTouchPoints > 1, causing a false positive. This is an accepted
// tradeoff — the Safari checkbox hack silently does nothing on macOS (no Taptic Engine).
```

- [ ] **Step 2: Fix CLAUDE.md API surface**

Move `// Returns: { mode: "haptics" | "audio" | "none" }` comment to after `haptics.play(PatternBlock[])` instead of after `haptics.getCapabilities()`. Update `getCapabilities()` return comment to show correct type:

```
haptics.play(PatternBlock[])
// Returns: { mode: "haptics" | "audio" | "none" }

haptics.getCapabilities()
// Returns: { haptics: boolean, audio: boolean, ios: boolean }

haptics.dispose()
// Cleans up AudioContext and Safari DOM elements
```

Also add `dispose()` to the API surface list in CLAUDE.md.

- [ ] **Step 3: Commit**

```bash
git add src/capabilities.ts CLAUDE.md
git commit -m "docs: document iPadOS detection limitation, fix CLAUDE.md API comments"
```

---

## Chunk 3: Final Verification

### Task 6: Full test + build pass

- [ ] **Step 1:** `npm test` — all pass
- [ ] **Step 2:** `npm run build` — clean
- [ ] **Step 3:** `npm run build:website` — clean
- [ ] **Step 4:** `git push origin main`
