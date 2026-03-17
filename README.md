# bzzz

Haptic feedback for the web. Native vibration + audio fallback.

[![npm](https://img.shields.io/npm/v/bzzz)](https://www.npmjs.com/package/bzzz)
[![bundle size](https://img.shields.io/bundlephobia/minzip/bzzz)](https://bundlephobia.com/package/bzzz)
[![license](https://img.shields.io/npm/l/bzzz)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue)](./src/index.ts)

## Why bzzz?

- **Zero dependencies** — nothing to audit, nothing to break
- **Tiny** — under 2KB minified + gzipped
- **Graceful fallback** — Vibration API → iOS Taptic Engine → audio clicks → silent
- **Accessible** — respects `prefers-reduced-motion` out of the box
- **Works everywhere** — Android, iOS 18+, desktop (audio), SSR-safe

## Install

```bash
npm install bzzz
```

## Quick start

```typescript
import { haptics } from "bzzz";

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
import { useHaptics } from "bzzz/react";

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
import { createHaptics } from "bzzz";

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

bzzz respects `prefers-reduced-motion: reduce`. When active, all methods silently return `{ mode: "none" }` — no vibration, no audio. Use `setEnabled(false)` for an in-app mute toggle.

## Documentation

Full docs, interactive demos, and pattern editor at [bzzz.vercel.app](https://bzzz.vercel.app)

## License

MIT
