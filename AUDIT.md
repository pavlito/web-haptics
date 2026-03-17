# bzzz — Deep Consistency Audit

Full audit of sound, visualization, patterns, pauses, animations, code architecture, and cross-platform behavior.

## Default pattern reference

```
selection:  8ms@0.4 → 12ms gap → 10ms@0.6                              = 30ms  (2 pulses)
success:   15ms@0.4 → 40ms gap → 25ms@0.7 → 60ms gap → 35ms@1.0       = 175ms (3 pulses)
error:     30ms@0.7 → 30ms gap → 30ms@0.7 → 30ms gap → 35ms@0.9 → 30ms gap → 40ms@1.0 = 225ms (4 pulses)
toggle:    12ms@0.5 → 24ms gap → 18ms@0.8 → 24ms gap → 12ms@0.5       = 90ms  (3 pulses)
snap:       8ms@0.3 → 8ms gap → 10ms@0.5 → 8ms gap → 12ms@0.7 → 8ms gap → 14ms@0.9 → 8ms gap → 16ms@1.0 = 92ms (5 pulses)
```

---

## Consistent (no action needed)

- **Audio ↔ vibration timing** — exact same ms cursor logic, no drift
- **Intensity: audio** `CLICK_GAIN(0.3) × intensity`, **vibration** PWM modulation — both respect 0-1
- **Pattern source** — single definition in `src/patterns.ts`, all website components import `defaultPatterns` from "bzzz"
- **Gap handling** — identical in vibration and audio
- **API surface** — `haptics.X()` == `createHaptics().play("X")` — same `playPattern()` path
- **No duplicate pattern data** — zero hardcoded copies in website
- **Pattern data integrity** — all website components import directly from library, zero hardcoded copies

---

# A. VISUALIZATION ISSUES

## A1. Button animation ↔ pattern mismatch

### Pulse count doesn't match animation beats

| Pattern | Actual pulses | Button animation | Beats shown | Match? |
|---------|--------------|-----------------|-------------|--------|
| selection | 2 taps | `btn-pop` (scale squeeze) | 1 squeeze | **NO** — 1 beat for 2-tap pattern |
| success | 3 rising | `btn-bounce` (3 vertical bounces) | 3 bounces | **YES** |
| error | 4 escalating | `btn-shake` (horizontal oscillation) | ~5 oscillations | **NO** — continuous shake, not 4 discrete hits |
| toggle | 3 symmetric | `btn-pop` (same as selection!) | 1 squeeze | **NO** — same animation as selection for different pattern |
| snap | 5 escalating | `btn-snap` (3 equal bounces) | 3 bounces | **NO** — 3 equal bounces for 5 escalating pulses |

`globals.css:1092-1095`

### Error animation direction is inverted

Error pattern escalates: `0.7 → 0.7 → 0.9 → 1.0` (building intensity).
`btn-shake` keyframes do the opposite: `±4px → ±3px → -1px` (decaying oscillation).
The visual suggests "calming down" while the haptic gets more intense.

`globals.css:1067-1074`

### Toggle and selection share the same animation

Both use `btn-pop` — a single scale squeeze. But:
- selection = 2 quick taps (tap-tap)
- toggle = 3 symmetric pulses (tap-TAP-tap)

These have completely different character. `globals.css:1092,1095`

---

## A2. Button animation timing vs actual pattern duration

| Pattern | Actual duration | Button animation | Slowdown |
|---------|----------------|-----------------|----------|
| selection | 30ms | 0.25s | **8.3×** |
| success | 175ms | 0.35s | 2.0× |
| error | 225ms | 0.3s | 1.3× |
| toggle | 90ms | 0.2s | 2.2× |
| snap | 92ms | 0.35s | 3.8× |

Button slowdown factor ranges from 1.3× to 8.3× — no consistent ratio.

---

## A3. PatternBar flashes everything at once

`pattern-bar.tsx:31` — `setTimeout(() => setLit(false), 400)` fires a single 400ms flash.

ALL pulse bars light up simultaneously regardless of pattern structure. A 3-pulse pattern with specific timing (pulse → gap → pulse → gap → pulse) looks identical to an instant single flash.

This is the most-used visualization (home page, docs, every demo) and it completely ignores the temporal structure that makes each pattern unique.

| Pattern | Real duration | Flash duration | What user sees |
|---------|--------------|---------------|----------------|
| selection | 30ms | 400ms | 13× too slow, all-at-once |
| success | 175ms | 400ms | 2.3× too slow, loses rising character |
| error | 225ms | 400ms | 1.8× too slow, loses build-up |
| toggle | 90ms | 400ms | 4.4× too slow, loses symmetry |
| snap | 92ms | 400ms | 4.3× too slow, loses escalation |

### CSS transition asymmetry compounds this

`.seq-tick-active .seq-tick-bar` has `transition: 0.02s` (instant on) but normal state has `transition: 0.4s ease-out` (slow fade).

So bars light up in 0.02s (good) but take 0.4s to fade out — the fade-out duration has no relation to the actual pattern timing. `globals.css:1023,1030`

---

## A4. WaveformCanvas timing inconsistency

`waveform-canvas.tsx:162` — `const animDuration = totalDuration + 200`

The playhead sweep takes `totalDuration + 200ms`, which creates inconsistent slowdown:

| Pattern | Duration | Animation time | Slowdown |
|---------|----------|---------------|----------|
| selection | 30ms | 230ms | **7.7×** |
| toggle | 90ms | 290ms | 3.2× |
| snap | 92ms | 292ms | 3.2× |
| success | 175ms | 375ms | 2.1× |
| error | 225ms | 425ms | 1.9× |

Short patterns appear proportionally much slower than long ones. A multiplicative factor (e.g., `totalDuration * 3`) would be more consistent.

### WaveformCanvas gap noise uses Math.random()

`waveform-canvas.tsx:108` — `const tiny = 2 + Math.random() * 3;` inside the draw loop.

Gap section noise height changes randomly every animation frame. Not seeded — same pattern looks slightly different each replay. Minor visual jitter.

---

## A5. V1 WaveformCanvas re-mounts on every click

`v1/page.tsx:53` — `<WaveformCanvas ... key={playCount} />`

Using `key={playCount}` destroys and recreates the entire canvas component on each play. This:
- Triggers full canvas setup (DPI scaling, initial draw) every time
- Creates a visual flash/blank between destructions
- Is wasteful — WaveformCanvas already handles replay via `playing` prop change internally (`waveform-canvas.tsx:200-205`)

---

## A6. Color inconsistency: DrawCanvas uses blue

Every visualization uses green (`#22c55e` / `rgba(34, 197, 94)`) **except DrawCanvas**:

`draw-canvas.tsx:99-102` — uses blue `rgba(59, 130, 246)` for fills and strokes.

This breaks the visual language where green = haptic activation.

---

## A7. V3 PatternBar at 2.5× scale amplifies flash problem

`v3/page.tsx:88` — `<PatternBar ... scale={2.5} />`

The bars are 2.5× larger (up to 80px tall) but still flash all-at-once for 400ms. At this scale, the lack of block-by-block animation is dramatically more visible.

---

## A8. Spring physics intensityMap doesn't match patterns

`page.tsx:23-29` defines a single intensity per pattern for the spring shake force:

| Pattern | intensityMap value | Actual max intensity | Actual first intensity | Match? |
|---------|-------------------|---------------------|----------------------|--------|
| selection | 0.4 | 0.6 | 0.4 | First pulse only |
| success | 0.7 | 1.0 | 0.4 | Neither first nor max |
| error | 1.0 | 1.0 | 0.7 | Max only |
| toggle | 0.5 | 0.8 | 0.5 | First pulse only |
| snap | 0.8 | 1.0 | 0.3 | Neither |

The values appear hand-tuned for "feel" rather than derived from pattern data.

---

## A9. Flash/clear timeout inconsistencies

| Component | Timeout | File |
|-----------|---------|------|
| PatternBar (internal lit) | 400ms | `pattern-bar.tsx:31` |
| PatternDemo flash | 400ms | `pattern-demo.tsx:56` |
| TriggerButton flash | 400ms | `trigger-button.tsx:29` |
| PlayDemo flash | 400ms | `play-demo.tsx:29` |
| DemoPanel animating | 400ms | `demo-panel.tsx:46` |
| PatternEditor playLit | 400ms | `pattern-editor.tsx:235` |
| **Home page animKey** | **500ms** | `page.tsx:87` |
| **V1 page animKey** | **500ms** | `v1/page.tsx:34` |
| **V2 page shakeClass** | **500ms** | `v2/page.tsx:35` (not in use) |
| **V2 page animKey** | **500ms** | `v2/page.tsx:39` (not in use) |
| **V3 page animKey** | **500ms** | `v3/page.tsx:59` |
| **V2 page ripple** | **600ms** | `v2/page.tsx:43` (not in use) |
| Toast dismiss | 2000ms | `demo-panel.tsx:52` |

All landing pages (page, v1, v2, v3) use 500ms. Docs components use 400ms. Same pattern looks different depending on which page you're on.

---

# B. CODE ARCHITECTURE ISSUES

## B1. Playground duplicates library internals

`playground/page.tsx` re-implements core library functionality instead of importing it:

| Feature | Library location | Playground duplicate | Differences |
|---------|-----------------|---------------------|-------------|
| iOS switch hack | `safari-haptics.ts:11-31` | `playground/page.tsx:441-462` | Same code, different variable name (`label` vs `iosLabel`) |
| iOS tap trigger | `safari-haptics.ts:42-46` | `playground/page.tsx:464-467` | Identical |
| TAP_INTERVAL = 26 | `safari-haptics.ts:4` | `playground/page.tsx:435` | Same value |
| PWM vibration | `playback.ts:8-24` | `playground/page.tsx:28-33` | Different — library fills duration, playground sends fixed 10 cycles |

### Duplicate iOS DOM elements

If the library and playground are used on the same session, **two** hidden `<input type="checkbox" switch>` elements get created in the DOM — one from `safari-haptics.ts` and one from `playground/page.tsx`. Each has its own module-level `label`/`iosLabel` variable.

### PWM implementation differs

- Library: cycles until `remaining >= PWM_CYCLE`, handles remainder
- Playground: always sends exactly `[on, off, on, off, on, off, on, off, on, off]` — fixed 10 values regardless of actual intensity duration

---

## B2. `dispose()` is a shared resource bomb

`audio.ts:23` — `let engine: AudioEngine | null = null;` is a module-level singleton.

Both `haptics.dispose()` (`runtime.ts:64`) and any `createHaptics().dispose()` (`runtime.ts:81`) call the same `resetAudioEngine()` + `destroySafariHaptic()`.

**Problem:** Calling `instanceA.dispose()` kills audio for ALL instances AND the global singleton.

```
const a = createHaptics();
const b = createHaptics();
a.dispose();           // kills shared AudioContext + iOS DOM
b.play("success");     // audio broken until lazily recreated
haptics.success();     // same — audio broken
```

Audio recovers lazily (next `getAudioEngine()` creates new AudioContext), but the iOS Safari DOM element is gone until someone triggers `ensureDOM()` again.

---

## B3. Docs code example doesn't match demo behavior

`docs/page.tsx:81-85` shows this code in the "play()" section:

```js
haptics.play([
  { type: "pulse", duration: 20, intensity: 0.5 },
  { type: "gap", duration: 24 },
  { type: "pulse", duration: 60 }
]);
```

But the `PlayDemo` component rendered below it (`play-demo.tsx:8-12`) actually plays:

```js
// No intensity on first pulse — defaults to 1.0
{ type: "pulse", duration: 20 },
{ type: "gap", duration: 24 },
{ type: "pulse", duration: 60 },
```

The code tab shows `intensity: 0.5` on the first pulse, but clicking "Run play()" plays at full intensity. The visual (PatternBar) also shows full-height bars. **What you see in the code tab ≠ what happens when you click.**

---

## B4. Pattern metadata duplicated across 6+ files

The patterns list (names, labels, descriptions, code strings) is independently defined in:

1. `page.tsx:14-20` — name, label, code
2. `v1/page.tsx:11-17` — name, label, code
3. `v2/page.tsx:10-16` — name, label, code
4. `v3/page.tsx:11-42` — name, label, description, code
5. `pattern-demo.tsx:8-39` — name, label, description, code
6. `demo-panel.tsx:7-13` — name, label, action

Each defines its own `patterns` array. Any name/label/description change requires updating 6 files.

### Description text differs between copies

- `pattern-demo.tsx:12`: "Light 2-pulse tap. Use for item picks, option changes, **list selections**."
- `v3/page.tsx:15`: "Light 2-pulse tap. Use for item picks, option changes." ← **missing "list selections"**
- `docs/page.tsx:310`: "Light 2-pulse tap" ← **no usage guidance**

---

## B5. Default active pattern inconsistent across pages

| Component | Default pattern | File |
|-----------|----------------|------|
| Home page | **Success** (index 1) | `page.tsx:40` |
| V1 page | **Success** (index 1) | `v1/page.tsx:21` |
| V2 page | **Success** (index 1) | `v2/page.tsx:19` |
| V3 page | **Success** (index 1) | `v3/page.tsx:46` |
| PatternEditor | **Success** (by name) | `pattern-editor.tsx:85` |
| **PatternDemo** | **Selection** (index 0) | `pattern-demo.tsx:42` |
| **DemoPanel** | **Selection** (string) | `demo-panel.tsx:32` |

Landing pages default to Success, docs demos default to Selection. Users switching between landing page and docs see a different pattern highlighted.

---

## B6. `useHaptics()` returns new object every render

`react.ts:31-41` — creates a new object literal every render call:

```ts
return {
  selection: haptics.selection,
  success: haptics.success,
  // ...
};
```

The individual function references are stable (from `haptics` const), but the wrapping object is recreated. If someone writes `const h = useHaptics(); useEffect(() => {...}, [h])` it would re-run every render. Comment says "stable" which is true per-function but misleading for the object.

---

## B7. `useCreateHaptics` has side effects during render

`react.ts:62-64`:
```ts
if (!instanceRef.current) {
  instanceRef.current = createHaptics(options);
}
```

This runs during render. `createHaptics()` can trigger `getAudioEngine()` → `new AudioContext()` via the playback chain. In React 18 strict mode, render functions run twice — this could create then orphan an AudioContext.

---

# C. ENGINE / PLAYBACK ISSUES

## C1. iOS timing stretch (not documented)

`safari-haptics.ts:4` — `TAP_INTERVAL = 26` (minimum ms between taps)

`safari-haptics.ts:71` — `delay = Math.max(pulseTimes[i] - pulseTimes[0], i * TAP_INTERVAL)`

| Pattern | Gap in pattern | iOS actual gap | Total | iOS total | Stretch |
|---------|---------------|----------------|-------|-----------|---------|
| selection | 12ms | ~26ms | 30ms | ~52ms | **+73%** |
| snap | 8ms (×4) | ~26ms (×4) | 92ms | ~148ms | **+61%** |
| toggle | 24ms (×2) | ~26ms (×2) | 90ms | ~94ms | +4% |
| success | 40ms, 60ms | 40ms, 60ms | 175ms | 175ms | 0% |
| error | 30ms (×3) | 30ms (×3) | 225ms | 225ms | 0% |

Selection and snap feel significantly different on iOS vs Android. Not documented anywhere.

---

## C2. PWM trailing remainder always vibrates

`playback.ts:21-23`:
```ts
if (remaining > 0) {
  result.push(remaining);
}
```

After the PWM while-loop, any leftover ms are pushed as a single "on" value. The Vibration API alternates on/off — odd positions are always "on".

Example: 45ms pulse at intensity 0.5:
- PWM cycle: 10ms on, 10ms off → 2 full cycles = 40ms
- Remaining: 5ms → pushed as "on"
- Result: `[10, 10, 10, 10, 5]` — that final 5ms always vibrates at full power

The last fragment always runs at 100% intensity regardless of the intended level. For short remainders this is imperceptible, but for `remaining` close to `PWM_CYCLE` it's noticeable.

---

## C3. Hardcoded audio parameters

`audio.ts:13-16` — all fixed, no user control:

```
CLICK_DURATION = 0.005  (5ms)
CLICK_GAIN     = 0.3
FILTER_FREQ    = 2200 Hz  (±200Hz random variation per click)
FILTER_Q       = 3
```

`createHaptics()` doesn't expose audio customization. Users can customize patterns but not how they sound.

---

## C4. Audio 5ms minimum + PWM skip

- `playback.ts:64` — pulses < 5ms produce no audio click
- `playback.ts:12` — pulses ≤ 20ms skip PWM intensity modulation (full vibration regardless of intensity)

Both are intentional hardware limitations. Don't affect default patterns (shortest = 8ms) but affect custom patterns.

---

## C5. Audio engine creates new buffer every click

`audio.ts:56` — `const buffer = createClickBuffer();` inside `playTap()`.

Every single tap creates a new `AudioBuffer`, fills it with random noise, creates a new `BufferSource`, `BiquadFilter`, and `GainNode`. These are not pooled or reused.

For rapid patterns like snap (5 clicks in 92ms), this creates 5 buffer allocations in quick succession. The Web Audio API handles this fine, but it's unnecessarily allocation-heavy compared to reusing a single noise buffer.

---

# D. SUMMARY: PRIORITY ORDER

### Tier 1 — Visual breaks meaning
1. **A1. Button animations** — wrong pulse count, inverted direction, toggle=selection
2. **A3. PatternBar flash** — all-at-once 400ms ignores temporal structure
3. **B3. Docs code ≠ demo** — play() section shows intensity:0.5 but demo plays intensity:1.0

### Tier 2 — Inconsistent but functional
4. **A4. WaveformCanvas timing** — additive +200ms disproportionally slows short patterns
5. **A6. DrawCanvas color** — blue instead of green
6. **A9. Flash timeouts** — 400ms in docs, 500ms on landing pages
7. **B5. Default pattern** — Success on landing, Selection in docs
8. **B4. Pattern metadata duplication** — 6 files with diverging descriptions

### Tier 3 — Architecture concerns
9. **B2. dispose() kills all instances** — shared AudioContext/iOS DOM is a trap
10. **B1. Playground duplicates library** — separate iOS hack, PWM, TAP_INTERVAL
11. **C2. PWM remainder always full-power** — trailing fragment ignores intensity
12. **A5. V1 re-mounts WaveformCanvas** — unnecessary via key prop

### Tier 4 — Nice to fix
13. **C1. iOS timing stretch undocumented** — selection/snap +61-73% on iOS
14. **A8. intensityMap hand-tuned** — doesn't derive from actual pattern data
15. **B6. useHaptics() unstable object** — misleading "stable" comment
16. **C5. Audio buffer per click** — allocation-heavy, could pool
17. **B7. useCreateHaptics side effects** — runs in render body
18. **C3. Audio params hardcoded** — no createHaptics() audio config

---

# E. ACCESSIBILITY

## E1. CSS animations ignore prefers-reduced-motion

JavaScript respects `prefers-reduced-motion` via `capabilities.ts:43-45` — returns `{ mode: "none" }` and blocks vibration/audio.

But CSS has **multiple animations** (btn-bounce, btn-shake, btn-pop, btn-snap, toast-in) with **zero** `@media (prefers-reduced-motion: reduce)` rules.

Users with motion sensitivity see full CSS animations even though the haptic engine is suppressed. The visual and engine are out of sync.

`globals.css` — 0 instances of `prefers-reduced-motion`

---

## E2. Pattern editor not keyboard-accessible

`pattern-editor.tsx:290-333` — Timeline is `<div onClick={...}>`, no `tabIndex`, no `role`, no keyboard handlers.

- Can't add blocks via keyboard (requires click on timeline)
- Can't move blocks via keyboard (requires mouse drag)
- Can't adjust intensity via keyboard (requires mouse drag on handle)
- Can't delete blocks via keyboard (requires double-click)
- Draggable blocks (`pe-block`) have no `role="button"`, no `tabIndex`, no `aria-label`

---

## E3. Focus styles missing on interactive elements

Pattern editor timeline (`pe-timeline`), drawing canvas (`pe-canvas`), and theremin pad (`theremin-pad`) are clickable/draggable but have no `:focus-visible` styles in CSS.

Keyboard users can't see which element has focus.

---

## E4. Hidden iOS checkbox exposed to screen readers

`safari-haptics.ts:16` — Label has `ariaHidden="true"` but the child `<input type="checkbox">` doesn't inherit this in all screen readers. The input itself should also have `aria-hidden="true"` or `tabindex="-1"`.

Same issue in playground duplicate: `playground/page.tsx:455-457`

---

## E5. No aria-live for copy feedback

When "Copied" text appears in code blocks, pattern editor, and doc demos, there's no `aria-live="polite"` region. Screen reader users don't know the copy succeeded.

Affects: `code-block.tsx`, `pattern-editor.tsx:269`, `doc-demo.tsx:46`

---

# F. RESPONSIVE / PERFORMANCE

## F1. Canvas elements are fixed-size, not responsive

| Canvas | Fixed size | File |
|--------|-----------|------|
| WaveformCanvas | 640×160px | `waveform-canvas.tsx:16-17` |
| DrawCanvas | 560×100px | `draw-canvas.tsx:244` |

Neither uses ResizeObserver or listens for window resize. On mobile screens <640px, WaveformCanvas overflows its container. DrawCanvas at 560px also overflows on phones.

Mobile CSS at `globals.css:282-338` adjusts some elements but doesn't address canvas sizes.

---

## F2. PatternEditor event listener leak during unmount

`pattern-editor.tsx:218-219` — `startDrag` adds `mousemove` and `mouseup` to `window`:

```ts
window.addEventListener("mousemove", onMove);
window.addEventListener("mouseup", onUp);
```

These are only removed in the `onUp` handler (lines 214-215). If the component unmounts during a drag operation, the listeners persist on window.

No cleanup in component's useEffect return.

---

## F3. DrawCanvas touch event crash risk

`draw-canvas.tsx:186-187`:
```ts
const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
```

`getPos` is called from `startDraw`, `moveDraw`, and `endDraw`. On `touchend`/`touchcancel`, `e.touches` is empty (length 0), so `e.touches[0]` is `undefined`. This would crash.

However, `endDraw` doesn't call `getPos`, so this is safe in practice. But `moveDraw` is bound to `onTouchMove` which always has touches. Low risk but fragile.

---

## F4. AudioContext resume not awaited

`audio.ts:49-50`:
```ts
if (ctx.state === "suspended") {
  ctx.resume().catch(() => undefined);
}
```

`ctx.resume()` returns a Promise but is not awaited. The `source.start()` on line 76 fires immediately. On first user interaction with a suspended AudioContext, the first click may produce no sound because the context hasn't finished resuming.

Subsequent clicks work because the context is already running by then.

---

## F5. No dark mode support

`globals.css` — 0 instances of `prefers-color-scheme`. All colors are hardcoded light theme (--gray0: #fff through --gray12: #171717).

The v1, v2 hero sections use dark backgrounds (#0a0a0a, #111) creating visual islands, but the overall site has no dark mode toggle or media query.

---

## F6. Concurrent play interrupts without warning

Calling `haptics.success()` while another pattern is playing:
- `navigator.vibrate()` automatically cancels the previous pattern (browser spec)
- Audio clicks are scheduled independently — previous clicks continue playing alongside new ones
- No documentation warns users about this behavior
- No test covers concurrent play scenarios

---

## F7. PatternEditor copyCode unhandled rejection

`pattern-editor.tsx:238-242`:
```ts
const copyCode = useCallback(async () => {
  await navigator.clipboard.writeText(patternToCode(pulses));
  setCopied(true);
  ...
}, [pulses]);
```

No try-catch. If clipboard access is denied (e.g., iframe, non-secure context), this throws an unhandled promise rejection.

Compare to `doc-demo.tsx:38-43` which correctly wraps in try-catch.

---

# G. UPDATED SUMMARY

## Issue count by category

| Category | Count | Issues |
|----------|-------|--------|
| Visualization | 9 | A1-A9 |
| Code architecture | 7 | B1-B7 |
| Engine/playback | 5 | C1-C5 |
| Accessibility | 5 | E1-E5 |
| Responsive/perf | 7 | F1-F7 |
| **Total** | **33** |

## Priority tiers (updated)

### Tier 1 — Breaks meaning or accessibility
1. **A1. Button animations** — wrong pulse count, inverted direction, toggle=selection
2. **A3. PatternBar flash** — all-at-once 400ms ignores temporal structure
3. **B3. Docs code ≠ demo** — play() shows intensity:0.5 but demo plays 1.0
4. **E1. CSS animations ignore reduced-motion** — visual animations fire when engine is suppressed
5. **E2. Pattern editor not keyboard-accessible** — no keyboard navigation at all

### Tier 2 — Inconsistent but functional
6. **A4. WaveformCanvas timing** — additive +200ms disproportionally slows short patterns
7. **A6. DrawCanvas color** — blue instead of green
8. **A9. Flash timeouts** — 400ms in docs, 500ms on landing pages
9. **B5. Default pattern** — Success on landing, Selection in docs
10. **B4. Pattern metadata duplication** — 6 files with diverging descriptions
11. **F1. Canvas not responsive** — fixed 640×160 / 560×100 overflows mobile
12. **F6. Concurrent play undocumented** — vibration cancels, audio overlaps

### Tier 3 — Architecture concerns
13. **B2. dispose() kills all instances** — shared AudioContext/iOS DOM
14. **B1. Playground duplicates library** — separate iOS hack, PWM, TAP_INTERVAL
15. **C2. PWM remainder full-power** — trailing fragment ignores intensity
16. **A5. V1 re-mounts WaveformCanvas** — unnecessary via key prop
17. **F2. PatternEditor event listener leak** — window listeners not cleaned on unmount
18. **F7. copyCode unhandled rejection** — no try-catch on clipboard
19. **E4. iOS checkbox exposed to screen readers** — input needs aria-hidden

### Tier 4 — Nice to fix
20. **C1. iOS timing stretch undocumented** — selection/snap +61-73%
21. **A8. intensityMap hand-tuned** — not derived from patterns
22. **B6. useHaptics() unstable object** — misleading "stable" comment
23. **C5. Audio buffer per click** — allocation-heavy, could pool
24. **B7. useCreateHaptics side effects** — in render body
25. **C3. Audio params hardcoded** — no createHaptics() config
26. **F4. AudioContext resume not awaited** — first click may miss
27. **F5. No dark mode** — all hardcoded light theme
28. **E3. Focus styles missing** — on timeline, canvas, theremin
29. **E5. No aria-live for copy** — screen readers miss "Copied"
30. **F3. DrawCanvas touch edge case** — touches[0] fragile

---

# H. CI/CD & PACKAGING

## H1. Duplicate GitHub Actions workflows

Two workflow files deploy to GitHub Pages with conflicting settings:

| | `deploy-pages.yml` | `deploy.yml` |
|---|---|---|
| Build command | `npm run build:website` | `cd website && npx next build` |
| Concurrency cancel | `false` | `true` |
| Step naming | Named steps | Unnamed `run:` steps |
| Env var | `env: GITHUB_PAGES: "true"` | Inline `GITHUB_PAGES=true` |

Both trigger on push to `main`. GitHub Actions runs **both** simultaneously, racing to deploy to the same `github-pages` environment. One will always fail or overwrite the other.

`.github/workflows/deploy-pages.yml` vs `.github/workflows/deploy.yml`

---

## H2. Missing Open Graph / social meta tags

`website/app/layout.tsx:9-13` — Metadata only has `title` and `description`:

```ts
export const metadata: Metadata = {
  title: "bzzz",
  description: "Haptic feedback for the web...",
};
```

Missing:
- `openGraph` (og:image, og:type, og:url) — no preview when shared on Twitter/LinkedIn/Slack
- `twitter` card metadata
- `icons` / favicon configuration (only logo.svg in public/, no favicon.ico)
- `metadataBase` for canonical URLs

---

## H3. Homepage field in package.json points to GitHub, not docs site

`package.json:51` — `"homepage": "https://github.com/pavlito/bzzz"`

But the actual docs site is at `https://pavlito.github.io/bzzz`.

QR code on homepage (`page.tsx:163`) correctly points to `pavlito.github.io/bzzz`, but npm homepage link would send users to GitHub instead of the documentation.

---

## H4. No favicon

`website/public/` contains only `logo.svg` and `logo-icon.svg`. No `favicon.ico`, no `apple-touch-icon.png`, no `manifest.json`.

Browser tab shows default Next.js icon or blank.

---

## H5. `as any` in library source

`capabilities.ts:25` — `const uad = (navigator as any).userAgentData;`

`userAgentData` is a real Web API (NavigatorUAData) but TypeScript's DOM lib doesn't include it. Should use a local type declaration instead of `as any`.

---

# I. CSS DESIGN SYSTEM

## I1. border-radius uses 6 different values without a system

```
1px  — spine lines, gap ticks
2px  — pulse tick bars, pe-block bars, phone home bar
4px  — mode badges, tab pills
5px  — install-copy button (inconsistent — should be 4 or 6)
6px  — buttons, code blocks, inputs, cards (primary radius)
8px  — playground buttons, theremin pad, QR sticker
10px — docs TOC sidebar
12px — v1 scope container
14px — phone notch
32px — phone (mobile breakpoint)
40px — phone frame
50%  — circles (ripple, theremin dot)
```

Most of the site uses 6px (`--border-radius` is not defined as a CSS variable). The 5px on `.install-copy` (`globals.css:728`) breaks the pattern — appears to be a typo for either 4px or 6px.

---

## I2. Inconsistent line-height scale

| Element | line-height | File |
|---------|------------|------|
| body | 25px | `globals.css:40` |
| content p | 25px | `globals.css:366` |
| inline code | 28px | `globals.css:57` |
| pre/code blocks | 17px | `globals.css:452` |
| playground info | 22px | `globals.css:1364` |

The body uses 25px, code blocks use 17px (1.3×), and inline code uses 28px (higher than body). No consistent scale ratio.

---

## I3. Syntax highlighting colors are hardcoded, not tokenized

`globals.css:494-510`:
```css
.hl-keyword { color: #e06c75; }
.hl-string  { color: #50a14f; }
.hl-comment { color: var(--gray9); }
.hl-tag     { color: #0694a2; }
```

Three use hardcoded hex values, one uses a CSS variable. No dark mode variants. The green for strings (`#50a14f`) is different from the haptic green (`#22c55e`) — this is fine semantically but the colors are not from any defined palette.

---

---

# J. ORPHANED CODE & MISSED ISSUES

## J1. V2 page is not in use — entire page + CSS is dead code

> **Note:** The phone mockup (v2) is not used. The entire `v2/page.tsx` and its associated CSS (phone frame, ripple, shake animations at `globals.css:1693-1950`) is dead code that can be removed.

This also means the following previously-noted issues are N/A:
- V2 phone shake timing
- V2-specific timeout values (500ms shake, 600ms ripple)
- `.v2-phone-bar` orphaned CSS (24 lines at `globals.css:1819-1843`)

---

## J2. Orphaned CSS classes — defined but never referenced

These CSS classes exist in `globals.css` but no `.tsx` file in the website uses them:

| CSS class | Line | Purpose |
|-----------|------|---------|
| `.hero-preview` | 156-165 | Stacked card preview container |
| `.hero-card` | 167-193 | Individual preview cards |
| `.hero-link` | 149-153 | Hero section link styling |
| Entire V2 phone section | 1693-1950 | Phone mockup, shake animations, ripple — not in use |

~300 lines of dead CSS (mostly v2). These are leftovers from earlier design iterations.

---

## J3. Caveat font loaded globally, used only on homepage

`layout.tsx:7` — `const caveat = Caveat({ subsets: ["latin"], display: "swap", variable: "--font-hand" });`
`layout.tsx:19` — Applied to `<html>` root: `className={... ${caveat.variable}}`

The `--font-hand` variable is only used in `.hero-qr-text` (`globals.css:341`), which only appears on the homepage (`page.tsx:170`). And on mobile, the QR section is `display: none` (`globals.css:318`).

Every other page (/docs, /v1, /v2, /v3, /playground, /editor) downloads this font for nothing.

---

## J4. framer-motion imported only on homepage, bundled for all

`page.tsx:5` — `import { motion, useSpring } from "framer-motion";`

Only the homepage uses framer-motion. Since this is a `"use client"` component, Next.js includes it in the client bundle. But because `page.tsx` is a route-level component, the module is only loaded for `/` — this is fine with code splitting.

However, `framer-motion` is ~45KB min+gzip. If the homepage is the main entry point, this impacts first-load performance.

---

## J5. Code highlighter breaks on escaped quotes

`code-block.tsx:34` — String regex: `/^(["'])(?:(?!\1).)*\1/`

This uses negative lookahead `(?!\1)` to match until the closing quote, but doesn't handle backslash escapes. Code like:

```js
const msg = "hello \"world\"";
```

Would match `"hello \"` as the first string (stops at escaped quote), leaving `world\"` as broken highlighting.

None of the current code examples in docs use escaped quotes, so this doesn't visibly break — but it will if examples are added.

---

## J6. ~~V2 phone shake class removed before animation finishes~~ — N/A (v2 not in use)

---

## J7. "use client" in library source file

`src/react.ts:1` — `"use client";`

This is a Next.js/RSC directive in a framework-agnostic library file. Users importing `bzzz/react` in Remix, Vite, or React Native will see this directive. Most bundlers ignore unknown directives, but it's semantically incorrect for a library — the consumer should decide client/server boundaries, not the library.

---

## J8. Copy button timeout stacking

`code-block.tsx:77` — `window.setTimeout(() => setCopied(false), 1200);`

Each click creates a new timeout without clearing the previous one. Rapid clicks stack timeouts:
1. Click 1: `setCopied(true)`, timeout A starts (1200ms)
2. Click 2 at 200ms: `setCopied(true)`, timeout B starts (1200ms)
3. Timeout A fires at 1200ms: `setCopied(false)` — icon resets
4. Timeout B fires at 1400ms: `setCopied(false)` — redundant but harmless

The issue: timeout A resets the icon while timeout B would have kept it showing "Copied" for 200ms more. On fast clicks, the checkmark disappears earlier than expected.

Same pattern exists in: `pattern-demo.tsx:56`, `trigger-button.tsx:29`, `play-demo.tsx:29`, `pattern-editor.tsx:241`

---

## J9. useCreateHaptics returns non-memoized object (same issue as B6)

`react.ts:75-81` creates a new wrapper object every render, same as `useHaptics()` (B6). Both hooks have this problem — neither uses `useMemo`.

---

## J10. No React hook tests

No test file exists for `src/react.ts`. The `useHaptics` and `useCreateHaptics` hooks are completely untested:
- No test for stable references
- No test for dispose on unmount
- No test for re-render behavior
- No test for options passing

`test/` directory contains only `runtime.test.ts`.

---

## Updated totals

> **Note:** V2 phone mockup page is not in use. Issues J1, J6, and several V2-specific sub-items are marked N/A. The entire v2 page + ~300 lines of CSS is dead code to be removed.

| Category | Count | Active |
|----------|-------|--------|
| Visualization | 9 | 9 |
| Code architecture | 7 | 7 |
| Engine/playback | 5 | 5 |
| Accessibility | 5 | 5 |
| Responsive/perf | 7 | 7 |
| CI/CD & packaging | 5 | 5 |
| CSS design system | 3 | 3 |
| Orphaned code & missed | 10 | 8 (J1, J6 are N/A) |
| **Total** | **51** | **49 active** |
