"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { haptics } from "web-haptics";
import type { PlaybackResult } from "web-haptics";

const PATTERNS = ["selection", "success", "error", "toggle", "snap"] as const;
type PatternName = (typeof PATTERNS)[number];

const PATTERN_LABELS: Record<PatternName, string> = {
  selection: "Selection",
  success: "Success",
  error: "Error",
  toggle: "Toggle",
  snap: "Snap",
};

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type GameState = "idle" | "playing" | "input" | "wrong" | "gameover";

export default function PlaygroundPage() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [sequence, setSequence] = useState<PatternName[]>([]);
  const [inputIndex, setInputIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [activePattern, setActivePattern] = useState<PatternName | null>(null);
  const [flashWrong, setFlashWrong] = useState<PatternName | null>(null);
  const playingRef = useRef(false);

  const playSequence = useCallback(async (seq: PatternName[]) => {
    playingRef.current = true;
    setGameState("playing");

    await sleep(500);

    for (const pattern of seq) {
      if (!playingRef.current) return;
      setActivePattern(pattern);
      haptics[pattern]();
      await sleep(600);
      setActivePattern(null);
      await sleep(300);
    }

    setGameState("input");
    setInputIndex(0);
  }, []);

  const startGame = useCallback(() => {
    const first = pickRandom(PATTERNS);
    const seq = [first];
    setSequence(seq);
    setScore(0);
    setInputIndex(0);
    playSequence(seq);
  }, [playSequence]);

  const handleInput = useCallback(
    (pattern: PatternName) => {
      if (gameState !== "input") return;

      haptics[pattern]();

      if (pattern !== sequence[inputIndex]) {
        // Wrong!
        setFlashWrong(pattern);
        setGameState("wrong");
        setTimeout(() => {
          setFlashWrong(null);
          setGameState("gameover");
          setHighScore((h) => Math.max(h, score));
        }, 800);
        return;
      }

      const nextIndex = inputIndex + 1;

      if (nextIndex >= sequence.length) {
        // Round complete
        const newScore = score + 1;
        setScore(newScore);
        setInputIndex(0);

        const next = pickRandom(PATTERNS);
        const newSeq = [...sequence, next];
        setSequence(newSeq);

        setTimeout(() => playSequence(newSeq), 800);
      } else {
        setInputIndex(nextIndex);
      }
    },
    [gameState, sequence, inputIndex, score, playSequence],
  );

  useEffect(() => {
    return () => {
      playingRef.current = false;
    };
  }, []);

  const statusText = () => {
    switch (gameState) {
      case "idle":
        return "Listen to the pattern, then repeat it.";
      case "playing":
        return "Listen...";
      case "input":
        return `Your turn — ${inputIndex + 1} of ${sequence.length}`;
      case "wrong":
        return "Wrong!";
      case "gameover":
        return `Game over! Score: ${score}`;
    }
  };

  return (
    <div className="playground">
      <div className="playground-header">
        <h1>Simon Haptics</h1>
        <p className="playground-desc">{statusText()}</p>
      </div>

      <div className="playground-score">
        <span>Score: {score}</span>
        <span>Best: {highScore}</span>
      </div>

      <div className="playground-grid">
        {PATTERNS.map((pattern) => (
          <button
            key={pattern}
            type="button"
            className={`playground-btn playground-btn-${pattern} ${
              activePattern === pattern ? "playground-btn-lit" : ""
            } ${flashWrong === pattern ? "playground-btn-wrong" : ""}`}
            onClick={() => handleInput(pattern)}
            disabled={gameState !== "input"}
          >
            {PATTERN_LABELS[pattern]}
          </button>
        ))}
      </div>

      <div className="playground-actions">
        {(gameState === "idle" || gameState === "gameover") && (
          <button
            type="button"
            className="playground-start"
            onClick={startGame}
          >
            {gameState === "gameover" ? "Play Again" : "Start"}
          </button>
        )}
      </div>
    </div>
  );
}
