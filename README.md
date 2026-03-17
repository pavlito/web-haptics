# web-haptics

Haptic feedback for the web. Native vibration + audio fallback.

[![npm](https://img.shields.io/npm/v/web-haptics)](https://www.npmjs.com/package/web-haptics)
[![bundle size](https://img.shields.io/bundlephobia/minzip/web-haptics)](https://bundlephobia.com/package/web-haptics)
[![license](https://img.shields.io/npm/l/web-haptics)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)](./src/index.ts)

## Why web-haptics?

- **Zero dependencies** — nothing to audit, nothing to break
- **Tiny** — under 2KB minified + gzipped
- **Graceful fallback** — Vibration API → iOS Taptic Engine → audio clicks → silent
- **Accessible** — respects `prefers-reduced-motion` out of the box
- **Works everywhere** — Android, iOS 18+, desktop (audio), SSR-safe

## Install

```bash
npm install web-haptics
```

## Quick start

```typescript
import { haptics } from "web-haptics";

button.addEventListener("click", () => {
  haptics.success();
});
```

Every call returns `{ mode: "haptics" | "audio" | "none" }` so you always know what happened.

## API

| Method | Description |
|--------|-------------|
| `haptics.selection()` | Quick tap — list item select, checkbox toggle |
| `haptics.success()` | Positive — save complete, upload done |
| `haptics.error()` | Negative — validation fail, network error |
| `haptics.toggle()` | State change — switch, expand/collapse |
| `haptics.snap()` | Spatial — scroll snap, drag threshold |
| `haptics.play(pattern)` | Raw pattern — array of pulse/gap blocks |
| `haptics.getCapabilities()` | Device check — `{ haptics, audio, ios, reducedMotion }` |
| `haptics.setEnabled(bool)` | Global mute/unmute |
| `haptics.isEnabled()` | Check if enabled |
| `haptics.dispose()` | Cleanup AudioContext and Safari DOM |

## React

```tsx
import { useHaptics } from "web-haptics/react";

function SaveButton() {
  const { success, error } = useHaptics();

  return (
    <button onClick={async () => {
      try { await save(); success(); }
      catch { error(); }
    }}>
      Save
    </button>
  );
}
```

Also available: `useCreateHaptics(options)` for isolated instances that auto-dispose on unmount.

## Custom patterns

```typescript
import { createHaptics } from "web-haptics";

const game = createHaptics({
  patterns: {
    hit: [
      { type: "pulse", duration: 30, intensity: 1.0 },
      { type: "gap", duration: 20 },
      { type: "pulse", duration: 50, intensity: 0.8 },
    ],
  },
});

game.play("hit");
```

## Fallback chain

```
navigator.vibrate()     → Android Chrome/Edge
    ↓ not available
iOS Safari checkbox hack → iOS 18+ Taptic Engine
    ↓ not available
Web Audio API clicks     → Desktop browsers, older iOS
    ↓ not available
Silent ({ mode: "none" }) → SSR, Node.js
```

## Browser support

| Platform | Engine | Support |
|----------|--------|---------|
| Android Chrome/Edge | Vibration API | Full haptics |
| iOS Safari 18+ | Taptic Engine | Native haptics |
| iOS Safari < 18 | — | Audio fallback |
| Desktop Chrome/Firefox/Safari | — | Audio fallback |
| SSR / Node.js | — | Silent (`none`) |

## Accessibility

web-haptics respects `prefers-reduced-motion: reduce`. When active, all methods silently return `{ mode: "none" }` — no vibration, no audio. Use `setEnabled(false)` for an in-app mute toggle.

## License

MIT
