# web-haptics

Web haptics and audio fallback for interaction feedback on the web.

## Install

```bash
npm install web-haptics
```

## Usage

```ts
import { haptics } from "web-haptics";

haptics.success();
```

Built-in methods:

```ts
haptics.selection();
haptics.success();
haptics.error();
haptics.toggle();
haptics.snap();
```

Custom runtime:

```ts
import { createHaptics } from "web-haptics";

const appHaptics = createHaptics({
  patterns: {
    saveSuccess: [
      { type: "pulse", duration: 20 },
      { type: "gap", duration: 24 },
      { type: "audio", sound: "soft-click", duration: 80 }
    ]
  }
});

appHaptics.play("saveSuccess");
```

## Docs

Local docs/demo app lives in `website/`.

## Notes

`web-haptics` uses `navigator.vibrate()` when available and falls back to audio when haptics are unavailable or rejected by the browser. Trigger haptics from user-initiated interactions when possible.
