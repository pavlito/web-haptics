# web-haptics

Haptic feedback library for the web. Native vibration + audio fallback.

## Structure

- `src/` — Library source (TypeScript, built with tsup → ESM + CJS)
- `website/` — Next.js 16 documentation site (Sonner-style design)
- `test/` — Tests (Vitest)
- `dist/` — Built output (don't edit)

## Commands

```bash
# Library
npm run build          # Build library (tsup)
npm run dev            # Watch mode
npm test               # Run tests (vitest)

# Website
npm run dev:website    # Dev server on :3005
npm run build:website  # Production build
npm run dev:all        # Library + website concurrent
```

## Website

Design matches Sonner (sonner.emilkowal.ski) exactly:
- 672px max-width, gray0–gray12 color scale, 6px border-radius, Inter font
- Landing page: `/` — hero, interactive demo, code sections
- Docs: `/getting-started`, `/haptics`, `/create-haptics`, `/fallbacks`
- Docs layout: left sidebar nav, right "On this page" TOC, pagination
- Pure CSS (no Tailwind), components in `website/components/`

## API surface

```ts
import { haptics } from "web-haptics";
haptics.selection() / .success() / .error() / .toggle() / .snap()
haptics.play(PatternBlock[])
// Returns: { mode: "haptics" | "audio" | "none" }

haptics.getCapabilities()
// Returns: { haptics: boolean, audio: boolean, ios: boolean }

haptics.dispose()
// Cleans up AudioContext and Safari DOM elements

import { createHaptics } from "web-haptics";
const h = createHaptics({ patterns: { ... } });
h.play("name") / h.register("name", [...])
h.dispose()
```

## Conventions

- Zero dependencies
- Keep library tiny — no unnecessary abstractions
- Website must stay faithful to Sonner's aesthetic
- Serbian in conversation, English in code/docs
