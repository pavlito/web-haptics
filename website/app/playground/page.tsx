"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haptics } from "web-haptics";

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
) {
  function loop() {
    if (stopRef.current) return;
    const intensity = intensityRef.current;
    if (intensity > 0 && navigator.vibrate) {
      const on = Math.max(1, Math.round(18 * intensity));
      const off = 18 - on;
      navigator.vibrate([on, off]);
    }
    requestAnimationFrame(loop);
  }
  loop();
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
  const [tab, setTab] = useState<"subbass" | "vibrate" | "theremin">("subbass");

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

      {tab === "subbass" && <SubBassPanel getAudioCtx={getAudioCtx} />}
      {tab === "vibrate" && <VibrateLoopPanel />}
      {tab === "theremin" && <ThereminPanel getAudioCtx={getAudioCtx} />}

      <div className="playground-info">
        <h3>How it works</h3>
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
        bassRef.current.gain.gain.value = 0;
      }
      setActive(false);
      return;
    }

    const ctx = getAudioCtx();
    if (!bassRef.current) {
      bassRef.current = createSubBass(ctx);
    }
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
        bassRef.current.gain.gain.value = 0;
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
  const hasVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  const toggle = useCallback(() => {
    if (active) {
      stopRef.current = true;
      navigator.vibrate?.(0);
      setActive(false);
      return;
    }

    stopRef.current = false;
    startVibrateLoop(intensityRef, stopRef);
    setActive(true);
  }, [active]);

  useEffect(() => {
    return () => {
      stopRef.current = true;
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
      stateRef.current.gain.gain.value = 0;
      stateRef.current.bass.gain.gain.value = 0;
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
        stateRef.current.gain.gain.value = 0;
        stateRef.current.bass.gain.gain.value = 0;
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
