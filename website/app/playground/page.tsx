"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Sub-bass engine ──────────────────────────────────────────────
function createSubBass(audioCtx: AudioContext) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 30;
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  return { osc, gain };
}

// ── Vibrate loop engine ──────────────────────────────────────────
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

export default function PlaygroundPage() {
  // ── Shared audio context ──
  const audioCtxRef = useRef<AudioContext | null>(null);

  function getAudioCtx() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  // ── Tab state ──
  const [tab, setTab] = useState<"ios" | "subbass" | "vibrate" | "theremin">("ios");

  return (
    <div className="playground">
      <div className="playground-header">
        <h1>Haptic Playground</h1>
        <p className="playground-desc">
          Experimental continuous vibration techniques
        </p>
      </div>

      <div className="playground-tabs">
        <button
          type="button"
          className={`playground-tab ${tab === "ios" ? "playground-tab-active" : ""}`}
          onClick={() => setTab("ios")}
        >
          iOS Loop
        </button>
        <button
          type="button"
          className={`playground-tab ${tab === "subbass" ? "playground-tab-active" : ""}`}
          onClick={() => setTab("subbass")}
        >
          Sub-bass
        </button>
        <button
          type="button"
          className={`playground-tab ${tab === "vibrate" ? "playground-tab-active" : ""}`}
          onClick={() => setTab("vibrate")}
        >
          Vibrate Loop
        </button>
        <button
          type="button"
          className={`playground-tab ${tab === "theremin" ? "playground-tab-active" : ""}`}
          onClick={() => setTab("theremin")}
        >
          Theremin
        </button>
      </div>

      {tab === "ios" && <IOSHapticLoopPanel />}
      {tab === "subbass" && <SubBassPanel getAudioCtx={getAudioCtx} />}
      {tab === "vibrate" && <VibrateLoopPanel />}
      {tab === "theremin" && <ThereminPanel getAudioCtx={getAudioCtx} />}

      <div className="playground-info">
        <h3>How it works</h3>
        {tab === "ios" && (
          <p>
            Rapidly toggles a hidden <code>&lt;input type="checkbox" switch&gt;</code> to
            trigger the Taptic Engine on iOS Safari. Each toggle fires one discrete
            tap — at ~26ms intervals it feels like continuous vibration. Requires iOS 18+.
          </p>
        )}
        {tab === "subbass" && (
          <p>
            Plays a sine wave at 20-60 Hz — below the hearing threshold but the
            speaker cone physically vibrates. Hold your phone to feel it.
          </p>
        )}
        {tab === "vibrate" && (
          <p>
            Calls <code>navigator.vibrate()</code> in a requestAnimationFrame
            loop. Each frame restarts the motor before it stops. Android Chrome only.
          </p>
        )}
        {tab === "theremin" && (
          <p>
            Combines all layers: sub-bass for physical feedback, vibrate loop on
            Android, and an audible tone that follows your finger. Drag around the pad.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sub-bass Panel ───────────────────────────────────────────────
function SubBassPanel({ getAudioCtx }: { getAudioCtx: () => AudioContext }) {
  const [active, setActive] = useState(false);
  const [freq, setFreq] = useState(30);
  const [volume, setVolume] = useState(0.8);
  const bassRef = useRef<{ osc: OscillatorNode; gain: GainNode } | null>(null);

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

  useEffect(() => {
    if (bassRef.current && active) {
      bassRef.current.osc.frequency.value = freq;
    }
  }, [freq, active]);

  useEffect(() => {
    if (bassRef.current && active) {
      bassRef.current.gain.gain.value = volume;
    }
  }, [volume, active]);

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

  return (
    <div className="playground-panel">
      <button
        type="button"
        className={`playground-big-btn ${active ? "playground-big-btn-active" : ""}`}
        onClick={toggle}
      >
        {active ? "Stop" : "Start Sub-bass"}
      </button>

      <label className="playground-slider">
        <span>Frequency: {freq} Hz</span>
        <input
          type="range"
          min={15}
          max={80}
          value={freq}
          onChange={(e) => setFreq(Number(e.target.value))}
        />
      </label>

      <label className="playground-slider">
        <span>Volume: {Math.round(volume * 100)}%</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
        />
      </label>
    </div>
  );
}

// ── Vibrate Loop Panel ───────────────────────────────────────────
function VibrateLoopPanel() {
  const [active, setActive] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const intensityRef = useRef(1);
  const stopRef = useRef(true);
  const cancelRef = useRef<(() => void) | null>(null);
  const hasVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

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

  useEffect(() => {
    return () => {
      stopRef.current = true;
      cancelRef.current?.();
      navigator.vibrate?.(0);
    };
  }, []);

  return (
    <div className="playground-panel">
      {!hasVibrate && (
        <p className="playground-warning">
          navigator.vibrate() not available on this browser
        </p>
      )}
      <button
        type="button"
        className={`playground-big-btn ${active ? "playground-big-btn-active" : ""}`}
        onClick={toggle}
        disabled={!hasVibrate}
      >
        {active ? "Stop" : "Start Vibration"}
      </button>

      <label className="playground-slider">
        <span>Intensity: {Math.round(intensity * 100)}%</span>
        <input
          type="range"
          min={10}
          max={100}
          value={Math.round(intensity * 100)}
          onChange={(e) => setIntensity(Number(e.target.value) / 100)}
        />
      </label>
    </div>
  );
}

// ── Theremin Panel ───────────────────────────────────────────────
function ThereminPanel({ getAudioCtx }: { getAudioCtx: () => AudioContext }) {
  const padRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    osc: OscillatorNode;
    gain: GainNode;
    bass: { osc: OscillatorNode; gain: GainNode };
    vibrateStop: { current: boolean };
    vibrateIntensity: { current: number };
  } | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [touching, setTouching] = useState(false);

  const startTouch = useCallback(
    (clientX: number, clientY: number) => {
      const pad = padRef.current;
      if (!pad) return;

      const ctx = getAudioCtx();
      const rect = pad.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));

      if (!stateRef.current) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        const bass = createSubBass(ctx);

        const vibrateStop = { current: false };
        const vibrateIntensity = { current: 0 };

        stateRef.current = { osc, gain, bass, vibrateStop, vibrateIntensity };

        if (typeof navigator.vibrate === "function") {
          startVibrateLoop(vibrateIntensity, vibrateStop);
        }
      }

      const freq = 200 + x * 800; // 200-1000 Hz
      stateRef.current.osc.frequency.value = freq;
      stateRef.current.gain.gain.value = y * 0.3;
      stateRef.current.bass.osc.frequency.value = 20 + y * 40;
      stateRef.current.bass.gain.gain.value = y * 0.9;
      stateRef.current.vibrateIntensity.current = y;

      setCoords({ x, y });
      setTouching(true);
    },
    [getAudioCtx],
  );

  const moveTouch = useCallback((clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad || !stateRef.current) return;

    const rect = pad.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));

    const freq = 200 + x * 800;
    stateRef.current.osc.frequency.value = freq;
    stateRef.current.gain.gain.value = y * 0.3;
    stateRef.current.bass.osc.frequency.value = 20 + y * 40;
    stateRef.current.bass.gain.gain.value = y * 0.9;
    stateRef.current.vibrateIntensity.current = y;

    setCoords({ x, y });
  }, []);

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

  return (
    <div className="playground-panel">
      <div
        ref={padRef}
        className={`theremin-pad ${touching ? "theremin-pad-active" : ""}`}
        onMouseDown={(e) => {
          e.preventDefault();
          startTouch(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => {
          if (e.buttons > 0) moveTouch(e.clientX, e.clientY);
        }}
        onMouseUp={endTouch}
        onMouseLeave={endTouch}
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.touches[0];
          startTouch(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          const t = e.touches[0];
          moveTouch(t.clientX, t.clientY);
        }}
        onTouchEnd={endTouch}
        onTouchCancel={endTouch}
      >
        <div className="theremin-labels">
          <span className="theremin-label-y">Intensity</span>
          <span className="theremin-label-x">Frequency</span>
        </div>
        {coords && (
          <div
            className="theremin-dot"
            style={{
              left: `${coords.x * 100}%`,
              bottom: `${coords.y * 100}%`,
            }}
          />
        )}
      </div>
      {coords && (
        <div className="theremin-readout">
          <span>{Math.round(200 + coords.x * 800)} Hz</span>
          <span>{Math.round(coords.y * 100)}% intensity</span>
        </div>
      )}
    </div>
  );
}

// ── iOS Haptic Loop Panel ────────────────────────────────────────
const TAP_INTERVAL = 26; // ms between checkbox toggles (from ios-vibrator-pro-max)

function triggerIOSTap(): void {
  if (typeof document === "undefined") return;
  const label = document.createElement("label");
  label.ariaHidden = "true";
  label.style.display = "none";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  label.appendChild(input);
  document.head.appendChild(label);
  label.click();
  document.head.removeChild(label);
}

function IOSHapticLoopPanel() {
  const [active, setActive] = useState(false);
  const [speed, setSpeed] = useState(TAP_INTERVAL);
  const stopRef = useRef(true);
  const speedRef = useRef(TAP_INTERVAL);
  const rafRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const startLoop = useCallback(() => {
    stopRef.current = false;
    let lastTap = 0;

    function loop() {
      if (stopRef.current) return;
      const now = performance.now();
      if (now - lastTap >= speedRef.current) {
        triggerIOSTap();
        lastTap = now;
      }
      rafRef.current = requestAnimationFrame(loop) as unknown as ReturnType<typeof setTimeout>;
    }

    // First tap synchronously (user gesture context for iOS 18.4+)
    triggerIOSTap();
    lastTap = performance.now();
    rafRef.current = requestAnimationFrame(loop) as unknown as ReturnType<typeof setTimeout>;
  }, []);

  const toggle = useCallback(() => {
    if (active) {
      stopRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current as unknown as number);
      setActive(false);
      return;
    }
    startLoop();
    setActive(true);
  }, [active, startLoop]);

  useEffect(() => {
    return () => {
      stopRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current as unknown as number);
    };
  }, []);

  return (
    <div className="playground-panel">
      <button
        type="button"
        className={`playground-big-btn ${active ? "playground-big-btn-active" : ""}`}
        onClick={toggle}
      >
        {active ? "Stop" : "Start iOS Haptic Loop"}
      </button>

      <label className="playground-slider">
        <span>Tap interval: {speed}ms ({Math.round(1000 / speed)} taps/sec)</span>
        <input
          type="range"
          min={16}
          max={100}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
      </label>

      <div className="playground-speed-presets">
        <button type="button" className="btn" onClick={() => setSpeed(16)}>Fast (16ms)</button>
        <button type="button" className="btn" onClick={() => setSpeed(26)}>Default (26ms)</button>
        <button type="button" className="btn" onClick={() => setSpeed(50)}>Slow (50ms)</button>
        <button type="button" className="btn" onClick={() => setSpeed(100)}>Pulse (100ms)</button>
      </div>
    </div>
  );
}
